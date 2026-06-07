#version 300 es

in vec2 aPosition;
in float aWolfSize;
in float aIsHighlighted;
in float aWolfSex;

uniform mat3 uMatrix;

out float aHighlighted;
out float aSex;

out float aTextureIndex;

void main() {
	gl_Position = vec4(uMatrix * vec3(aPosition, 1), 1);
	gl_PointSize = aWolfSize;
	aHighlighted = aIsHighlighted;
	aSex = aWolfSex;
}
