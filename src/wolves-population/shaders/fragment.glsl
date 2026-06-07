#version 300 es

precision highp float;

out vec4 outColor;

in float aHighlighted;
in float aSex;
uniform sampler2D uTextureMale;
uniform sampler2D uTextureFemale;

uniform float uTime;

in float aTextureIndex;

void main() {
	vec4 textureColor;

	if (aSex == 1.0) {
		textureColor = texture(uTextureFemale, gl_PointCoord);
	} else {
		textureColor = texture(uTextureMale, gl_PointCoord);
	}

	if (aHighlighted == 1.0) {
		textureColor = textureColor * vec4(0.1725, 0.2431, 0.3137, 1);
	}

	outColor = textureColor;
}
