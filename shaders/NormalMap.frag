#version 110

// for transform
uniform mat4 in_modelMatrix, in_viewMatrix, in_projectionMatrix;
vec3 transformDirection3(in mat4 transformMatrix, in vec3 vector);

// for illumination model
uniform vec4 in_color;
uniform float in_ambientRatio, in_diffusionRatio, in_specularRatio, in_shiness;
varying vec3 fragNormalVector;
varying vec3 fragEyeVector;
varying vec3 fragLightVector;
vec4 simpleIlluminationModel(vec4 faceColor, vec3 eyeVector, vec3 lightVector, vec3 normalVector, float ambientRatio, float diffusionRatio, float specularRatio, float shiness);

// for texture
varying vec2 fragTexCoord;

// for diffuse texture
uniform sampler2D in_texDiffuse;
uniform bool in_texDiffuseExists;

// for normal texture
uniform sampler2D in_texNormal;
uniform bool in_texNormalExists;
uniform vec3 in_surfaceNormal, in_tangentVector, in_bitangentVector;
in mat4 tangentMatrix;

void main() {
	vec3 normalVector = fragNormalVector;
	if(in_texNormalExists) {
		normalVector = texture2D(in_texNormal, fragTexCoord).xyz - vec3(0.5);
		normalVector = transformDirection3(in_viewMatrix * in_modelMatrix * tangentMatrix, normalVector);
	}

	vec4 color = vec4(1.0);
	if(in_texDiffuseExists) {
		color = texture2D(in_texDiffuse, fragTexCoord);
	}

	gl_FragColor = color * simpleIlluminationModel(in_color, fragEyeVector, fragLightVector, normalVector, in_ambientRatio, in_diffusionRatio, in_specularRatio, in_shiness);
}