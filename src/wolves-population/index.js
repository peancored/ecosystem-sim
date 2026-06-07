import GLProgram from '../gl-program/index.js';
import Wolf from './wolf.js';

export default class WolvesPopulation extends GLProgram {
	constructor(gl, uMatrix, environment, rabbits) {
		super(gl);

		this.uMatrix = uMatrix;
		this.amount = 20;
		this.wolves = new Array(this.amount);
		this.environment = environment;
		this.rabbits = rabbits;

		this.generateWolves();
		this.loading = Promise.all([this.setupProgram()]);
	}

	async setupProgram() {
		await super.setupProgram(
			'./src/wolves-population/shaders/vertex.glsl',
			'./src/wolves-population/shaders/fragment.glsl'
		);

		this.buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

		this.setupAttributes();
		this.setupUniforms();

		this.loadTextures();
	}

	setupAttributes() {
		this.gl.bindVertexArray(this.vao);

		const positionAttributeLocation = this.gl.getAttribLocation(
			this.program,
			'aPosition'
		);
		const wolfSizeAttributeLocation = this.gl.getAttribLocation(
			this.program,
			'aWolfSize'
		);
		const isHighlightedAttributeLocation = this.gl.getAttribLocation(
			this.program,
			'aIsHighlighted'
		);
		const wolfSexAttributeLocation = this.gl.getAttribLocation(
			this.program,
			'aWolfSex'
		);

		this.gl.vertexAttribPointer(
			positionAttributeLocation,
			2,
			this.gl.FLOAT,
			false,
			5 * Float32Array.BYTES_PER_ELEMENT,
			0
		);
		this.gl.vertexAttribPointer(
			wolfSizeAttributeLocation,
			1,
			this.gl.FLOAT,
			false,
			5 * Float32Array.BYTES_PER_ELEMENT,
			2 * Float32Array.BYTES_PER_ELEMENT
		);
		this.gl.vertexAttribPointer(
			isHighlightedAttributeLocation,
			1,
			this.gl.FLOAT,
			false,
			5 * Float32Array.BYTES_PER_ELEMENT,
			3 * Float32Array.BYTES_PER_ELEMENT
		);
		this.gl.vertexAttribPointer(
			wolfSexAttributeLocation,
			1,
			this.gl.FLOAT,
			false,
			5 * Float32Array.BYTES_PER_ELEMENT,
			4 * Float32Array.BYTES_PER_ELEMENT
		);

		this.gl.enableVertexAttribArray(positionAttributeLocation);
		this.gl.enableVertexAttribArray(wolfSizeAttributeLocation);
		this.gl.enableVertexAttribArray(isHighlightedAttributeLocation);
		this.gl.enableVertexAttribArray(wolfSexAttributeLocation);
	}

	async loadTextures() {
		const { registry: maleTextureRegistry } = await this.loadTexture(
			'./icons/wolf-male.png'
		);
		const { registry: femaleTextureRegistry } = await this.loadTexture(
			'./icons/wolf-female.png'
		);
		this.gl.useProgram(this.program);

		const maleImageLocation = this.gl.getUniformLocation(
			this.program,
			'uTextureMale'
		);
		this.gl.uniform1i(maleImageLocation, maleTextureRegistry);

		const femaleImageLocation = this.gl.getUniformLocation(
			this.program,
			'uTextureFemale'
		);
		this.gl.uniform1i(femaleImageLocation, femaleTextureRegistry);
	}

	setupUniforms() {
		super.setupUniforms();
		const matrixLocation = this.gl.getUniformLocation(this.program, 'uMatrix');

		this.gl.uniformMatrix3fv(matrixLocation, false, this.uMatrix);
	}

	generateWolves() {
		for (let i = 0; i < this.wolves.length; i++) {
			const randomTile = this.environment.getRandomGrassTile();
			this.wolves[i] = new Wolf(randomTile.x, randomTile.y, this.environment);
		}

		this.rawData = new Float32Array(this.amount * 5);
	}

	draw() {
		for (let i = 0; i < this.wolves.length; i++) {
			this.wolves[i].live();
			[
				this.rawData[5 * i],
				this.rawData[5 * i + 1],
				this.rawData[5 * i + 2],
				this.rawData[5 * i + 3],
				this.rawData[5 * i + 4],
			] = this.wolves[i].toArray();
		}

		this.gl.useProgram(this.program);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bindVertexArray(this.vao);

		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.rawData,
			this.gl.DYNAMIC_DRAW
		);
		this.gl.drawArrays(this.gl.POINTS, 0, this.wolves.length);
	}
}
