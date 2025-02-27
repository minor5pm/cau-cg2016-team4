#version 150

vec3 transformDirection3(in mat4 transformMatrix, in vec3 vector);

uniform mat4 in_modelMatrix, in_viewMatrix, in_projectionMatrix;
uniform sampler2D in_texDiffuse;
uniform sampler2D in_texNormal;
uniform sampler2D in_texHeight;
in mat4 tangentMatrix;

// for illumination model
uniform vec4 in_color;
uniform float in_ambientRatio, in_diffusionRatio, in_specularRatio, in_shiness;
varying vec3 fragEyeVector;
varying vec3 fragLightVector;

uniform float parallaxScale;

varying vec2 fragTexCoord;
varying vec3 TlightPos;
varying vec3 TcamPos;



out vec4 resultingColor;

vec4 simpleIlluminationModel(vec4 faceColor, vec3 eyeVector, vec3 lightVector, vec3 normalVector, float ambientRatio, float diffusionRatio, float specularRatio, float shiness, float shadow) {
	vec3 l = normalize(lightVector);
	vec3 v = normalize(eyeVector);
	vec3 n = normalize(normalVector);
	vec3 r = dot(n, l) > 0.0 ? normalize((2.0 * dot(n, l) * n) - l) : vec3(0, 0, 0);
	//vec3 h = dot(n, l) > 0.0 ? normalize(l + v) : vec3(0, 0, 0);

	//vec3 r = (2.0 * dot(n, l) * n) - l;

	float ambient = 1.0;
	//float diffusion = max(0.0, dot(n, l));
	float diffusion = max(-1.0, dot(n, l));
	float specular = pow(max(0.0, dot(v, r)), shiness);
	//float specular = pow(max(0.0, dot(n, h)), shiness);

	if(diffusion < 0.0) {
		specular = 0.0;
		if(diffusionRatio > 0.0)
			diffusion *= ambientRatio / diffusionRatio;
		else
			diffusion = 0.0;
	}

	return vec4(faceColor.xyz * (ambientRatio * ambient + (diffusionRatio * diffusion + specularRatio * specular) * shadow), faceColor.w);
}

vec2 parallaxMapping(in vec3 V, in vec2 T, out float parallaxHeight){

	const float minLayers = 10;
	const float maxLayers = 15;

	float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0, 0, 1), V)));

	float layerHeight = 1.0 / numLayers;
	float currentLayerheight = 0;
	vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
	vec2 currentTextureCoords = T;

	float heightFromTexture = texture(in_texHeight, currentTextureCoords).r;
	while(heightFromTexture > currentLayerheight){
		currentLayerheight += layerHeight;
		currentTextureCoords -= dtex;
		heightFromTexture = texture(in_texHeight, currentTextureCoords).r;
	}

	//relief parallax mapping
	vec2 deltaTexCoord = dtex / 2;
	float deltaHeight = layerHeight / 2;
	currentTextureCoords += deltaTexCoord;
	currentLayerheight -= deltaHeight;
	
	const int numSearches = 5;

	for(int i=0; i<numSearches; i++){
		deltaTexCoord /=2;
		deltaHeight /=2;
		heightFromTexture = texture(in_texHeight, currentTextureCoords).r;
		if(heightFromTexture > currentLayerheight){
			currentTextureCoords -= deltaTexCoord;
			currentLayerheight += deltaHeight;
		}
		else{
			currentTextureCoords += deltaTexCoord;
			currentLayerheight -= deltaHeight;
		}
	}




	parallaxHeight = currentLayerheight;
	return currentTextureCoords;
	

}
float parallaxSoftShadowMult(vec3 L, vec2 initTexCoord, float initHeight){
	float shadowMult=1;
	const float minLayers = 15;
	const float maxLayers = 30;

	if(dot(vec3(0, 0, 1), L) > 0){
		float numSamplesUnderSurface = 0;
		shadowMult=0;
		float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0, 0, 1), L)));
		float layerHeight = initHeight / numLayers;
		vec2 texStep = parallaxScale * L.xy / L.x / numLayers;

		float currentLayerHeight = initHeight - layerHeight;
		vec2 currentTexCoord = initTexCoord + texStep;
		float heightFromTexture = texture(in_texHeight, currentTexCoord).r;
		int stepIndex = 1;

		while(currentLayerHeight > 0){
			if(heightFromTexture < currentLayerHeight){
				numSamplesUnderSurface += 1;
				float newShadowMult = (currentLayerHeight - heightFromTexture) * (1.0 - stepIndex / numLayers);
				shadowMult = max(shadowMult, newShadowMult);
			}
			stepIndex==1;
			currentLayerHeight -= layerHeight;
			currentTexCoord += texStep;
			heightFromTexture = texture(in_texHeight, currentTexCoord).r;

		}

		if(numSamplesUnderSurface < 1)
			shadowMult=1;
		else
			shadowMult = 1.0 - shadowMult;
	}

	return shadowMult;
}

vec4 normalMapLighting(vec2 T, vec3 L, vec3 V, float shadowMult){
	vec3 N = normalize(texture(in_texNormal, T).xyz * 2 - 1);
	vec3 D = texture(in_texDiffuse, T).rgb;

	N = transformDirection3(in_viewMatrix * in_modelMatrix * tangentMatrix, N);

	/*//ambient
	float iamb = 0.5;
	//diffuse
	float idiff = clamp(dot(N, L), 0, 1);

	//spec
	float ispec;
	if(dot(N, L) > 0.2){
		vec3 R = reflect(-L, N);
		ispec = pow(dot(R, V), 32) / 1.5;
	}

	vec4 resColor;
	resColor.rgb = D * (iamb + (idiff + ispec) * pow(shadowMult, 4));
	resColor.a = 1;
	return resColor;*/

	return simpleIlluminationModel(texture(in_texDiffuse, T), fragEyeVector, L, N, in_ambientRatio, in_diffusionRatio, in_specularRatio, in_shiness, 1.0);
}
void main(){
	vec3 V = normalize(TcamPos);
	vec3 L = normalize(TlightPos);

	float parallaxHeight;
	vec2 T = parallaxMapping(V, fragTexCoord, parallaxHeight);

	//float shadowMult = parallaxSoftShadowMult(L, T, parallaxHeight - 0.05);
	float shadowMult = 0.0;

	//gl_FragColor = normalMapLighting(T,L,V, shadowMult);
	resultingColor = in_color * clamp(normalMapLighting(T,L,V, shadowMult), 0, 1);
}