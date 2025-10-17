// Cursor trail shader that creates a hexagonal trailing effect with rainbow plasma
// Based on Inigo Quilez's 2D distance functions: https://iquilezles.org/articles/distfunctions2d/

// Process each edge: compute distance and determine if point is inside
#define PROCESS_EDGE(a, b) \
    { \
        vec2 edge = b - a; \
        vec2 pa = p - a; \
        float lenSq = dot(edge, edge); \
        float validEdge = step(1e-8, lenSq); \
        float invLenSq = validEdge / max(lenSq, 1e-8); \
        /* Project point onto edge, clamped to [0,1] to stay within segment */ \
        float t = clamp(dot(pa, edge) * invLenSq, 0.0, 1.0); \
        vec2 diff = pa - edge * t; \
        float dEdge = dot(diff, diff); \
        float dPoint = dot(pa, pa); \
        /* Track minimum distance to any edge */ \
        minDist = min(minDist, mix(dPoint, dEdge, validEdge)); \
        /* Cross product determines which side of edge the point is on */ \
        float cross = edge.x * pa.y - edge.y * pa.x; \
        float insideEdge = step(0.0, cross); \
        /* Point must be inside all edges to be inside polygon */ \
        inside = min(inside, mix(1.0, insideEdge, validEdge)); \
    }

// Signed distance field for hexagon (negative inside, positive outside)
// Vertices must be in counter-clockwise order
float sdHexagon(in vec2 p, in vec2 v0, in vec2 v1, in vec2 v2, in vec2 v3, in vec2 v4, in vec2 v5) {
    float minDist = 1e20;
    float inside = 1.0;

    PROCESS_EDGE(v0, v1)
    PROCESS_EDGE(v1, v2)
    PROCESS_EDGE(v2, v3)
    PROCESS_EDGE(v3, v4)
    PROCESS_EDGE(v4, v5)
    PROCESS_EDGE(v5, v0)

    float dist = sqrt(max(minDist, 0.0));
    return mix(dist, -dist, inside);
}

#undef PROCESS_EDGE

// Signed distance field for rectangle (negative inside, positive outside)
float sdRectangle(in vec2 p, in vec2 center, in vec2 halfSize) {
    vec2 d = abs(p - center) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Convert screen coordinates to normalized coordinates [-1, 1]
vec2 normPosition(vec2 pos, float invResY) {
    return (pos * 2.0 - iResolution.xy) * invResY;
}

// Convert pixel size to normalized size
vec2 normSize(vec2 size, float invResY) {
    return size * 2.0 * invResY;
}

// Represents cursor as a quad with four corners
struct Quad {
    vec2 topLeft;
    vec2 topRight;
    vec2 bottomLeft;
    vec2 bottomRight;
};

// Construct quad from top-left position and size
Quad getQuad(vec2 pos, vec2 size) {
    Quad q;
    q.topLeft = pos;
    q.topRight = pos + vec2(size.x, 0.0);
    q.bottomLeft = pos - vec2(0.0, size.y);
    q.bottomRight = pos + vec2(size.x, -size.y);
    return q;
}

// Select 4 corners from quad based on movement direction
// sel.x: 0=left, 1=right | sel.y: 0=top, 1=bottom
// Returns corners in counter-clockwise order for hexagon construction
void selectCorners(Quad q, vec2 sel, out vec2 p1, out vec2 p2, out vec2 p3, out vec2 p4) {
    p1 = mix(mix(q.topRight, q.topLeft, sel.x),
             mix(q.bottomRight, q.bottomLeft, sel.x),
             sel.y);

    p2 = mix(mix(q.topLeft, q.bottomLeft, sel.x),
             mix(q.topRight, q.bottomRight, sel.x),
             sel.y);
    p3 = mix(mix(q.bottomRight, q.topRight, sel.x),
             mix(q.bottomLeft, q.topLeft, sel.x),
             sel.y);

    p4 = mix(mix(q.bottomLeft, q.bottomRight, sel.x),
             mix(q.topLeft, q.topRight, sel.x),
             sel.y);
}

// Cubic ease-out function for smooth animation
float ease(float x) {
    float clamped = clamp(x, 0.0, 1.0);
    float t = 1.0 - clamped;
    return 1.0 - t * t * t;
}

// Trail animation duration in seconds
const float DURATION = 0.5;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Start with background texture
    fragColor = texture(iChannel0, fragCoord / iResolution.xy);

    // Calculate animation progress with easing
    float baseProgress = clamp((iTime - iTimeCursorChange) / DURATION, 0.0, 1.0);

    // Skip rendering when animation is complete
    if (baseProgress >= 1.0) {
        return;
    }

    // Precompute reused values
    float invResY = 1.0 / iResolution.y;
    float aaWidth = 2.0 * invResY;

    // Normalize cursor positions and sizes to screen-independent coordinates
    vec2 currentPos = normPosition(iCurrentCursor.xy, invResY);
    vec2 previousPos = normPosition(iPreviousCursor.xy, invResY);
    vec2 currentSize = normSize(iCurrentCursor.zw, invResY);
    vec2 previousSize = normSize(iPreviousCursor.zw, invResY);

    // Determine movement direction and construct cursor quads
    vec2 deltaPos = currentPos - previousPos;
    Quad currentCursor = getQuad(currentPos, currentSize);
    Quad previousCursor = getQuad(previousPos, previousSize);
    vec2 selector = step(vec2(0.0), deltaPos);

    // Select corners based on movement direction
    vec2 currP1, currP2, currP3, currP4;
    vec2 prevP1, prevP2, prevP3, prevUnused;
    selectCorners(currentCursor, selector, currP1, currP2, currP3, currP4);
    selectCorners(previousCursor, selector, prevP1, prevP2, prevP3, prevUnused);

    float easedProgress = ease(baseProgress);
    float easedProgressDouble = ease(min(baseProgress * 2.0, 1.0));

    // Create trailing effect by moving diagonal point slower
    vec2 trailP1 = mix(prevP1, currP1, easedProgress);
    vec2 trailP2 = mix(prevP2, currP2, easedProgressDouble);
    vec2 trailP3 = mix(prevP3, currP3, easedProgressDouble);

    // Compute hexagon SDF and convert to alpha with antialiasing
    vec2 normCoord = normPosition(fragCoord, invResY);
    float sdfHex = sdHexagon(normCoord, trailP1, trailP2, currP2, currP4, currP3, trailP3);
    float alpha = 1.0 - smoothstep(-aaWidth, aaWidth, sdfHex);

    // Compute current cursor SDF
    vec2 halfCurrentSize = currentSize * 0.5;
    vec2 currentCenter = currentPos + vec2(halfCurrentSize.x, -halfCurrentSize.y);
    float sdfCurrentCursor = sdRectangle(normCoord, currentCenter, halfCurrentSize);

    // Generate rainbow plasma effect
    float v1v = sin(normCoord.x * 10.0 + iTime);
    float v2v = sin(normCoord.y * 10.0 + iTime * 4.5);
    float v3v = sin((normCoord.x + normCoord.y) * 10.0 + iTime * 0.5);
    float v4v = sin(length(normCoord) * 10.0 + iTime * 2.0);

    float plasma = (v1v + v2v + v3v + v4v) / 4.0;
    vec4 rainbowColor = vec4(
            0.5 + 0.5 * sin(plasma * 6.28 + 0.0),
            0.5 + 0.5 * sin(plasma * 6.28 + 2.09),
            0.5 + 0.5 * sin(plasma * 6.28 + 4.18),
            1.0
        );

    // Calculate line length (distance between cursor centers)
    vec2 previousCenter = previousPos + vec2(previousSize.x * 0.5, -previousSize.y * 0.5);
    float lineLength = distance(currentCenter, previousCenter);

    // Compute fade factor based on distance from current cursor
    float distFromCursor = distance(normCoord, currentCenter);
    float fadeFactor = 1.0 - smoothstep(0.0, lineLength, distFromCursor);

    // Apply fading effect to rainbow color
    vec4 fadedRainbowColor = rainbowColor * fadeFactor;

    // Enhance color saturation for more vibrant trail effect
    float gray = dot(fadedRainbowColor.rgb, vec3(0.299, 0.587, 0.114));
    const float saturationBoost = 1.8;
    vec4 enhancedColor = clamp(
        mix(vec4(vec3(gray), fadedRainbowColor.a), fadedRainbowColor, saturationBoost),
        0.0, 1.0
    );

    // Blend trail color with background
    vec4 originalColor = fragColor;
    fragColor.rgb = mix(fragColor.rgb, enhancedColor.rgb, alpha);

    // Remove trail where it overlaps with current cursor
    fragColor.rgb = mix(fragColor.rgb, originalColor.rgb, step(sdfCurrentCursor, 0.0));
}
