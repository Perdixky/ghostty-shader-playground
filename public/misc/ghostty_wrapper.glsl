#version 300 es
#define WEB 1

precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iCurrentCursor;
uniform vec4 iPreviousCursor;
uniform float iTimeCursorChange;
uniform vec4 iCurrentCursorColor;
uniform vec4 iPreviousCursorColor;

out vec4 fragColor;

//$REPLACE$
void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
