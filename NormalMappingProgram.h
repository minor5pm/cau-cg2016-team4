#pragma once
#include "SimpleIlluminationModelShaderProgram.h"
#include "Vector.h"
class NormalMappingProgram : public SimpleIlluminationModelShaderProgram {
private:
	Vector3f lightVector;
public: 
	NormalMappingProgram(Recipe & recipe);
	static NormalMappingProgram create();


	virtual void onPreDraw(const Model & model) const;
	virtual void onPostDraw(const Model & model) const;

};