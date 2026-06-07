import { scaleByDeltaTime } from '../helpers.js';
import { SEX } from '../rabbits-population/constants.js';

export default class Wolf {
	constructor(x, y, environment) {
		this.config = {
			inheritableProps: {
				baseSpeed: 1,
			},
			sex: Math.random() < 0.5 ? SEX.MALE : SEX.FEMALE,
			seed: Math.random(),
		};
		this.state = {
			position: glMatrix.vec2.fromValues(x, y),
			initialPosition: glMatrix.vec2.fromValues(x, y),
			highlighted: 0,
			scaleCoefficientFrequency: 1,
			projectedSize: 60,
			size: 60,
		};

		this.environment = environment;

		this.startMoving();
	}

	toArray() {
		return [
			this.state.position[0],
			this.state.position[1],
			this.state.projectedSize,
			this.state.highlighted,
			this.config.sex,
		];
	}

	live() {
		this.checkEnvironment();

		if (!this.state.activity && Math.random() < 0.001) {
			this.stop();
			this.scheduleStartMovingInRandomDirection();
		}

		this.move();
	}

	startMoving() {
		this.state.speed = this.config.inheritableProps.baseSpeed;

		this.state.velocity = glMatrix.vec2.fromValues(
			Math.random() * 2 - 1,
			Math.random() * 2 - 1
		);
		glMatrix.vec2.normalize(this.state.velocity, this.state.velocity);
	}

	changeDirection() {
		this.state.speed = this.config.inheritableProps.baseSpeed;

		const angle =
			noise.perlin3(
				this.state.initialPosition[0],
				this.state.initialPosition[1],
				scaleByDeltaTime(global.timeFromStart / 10000)
			) *
			2 *
			Math.PI;

		if (!this.state.prevAngle) {
			this.state.prevAngle = angle;
		}

		glMatrix.vec2.rotate(
			this.state.velocity,
			this.state.velocity,
			[0, 0],
			this.state.prevAngle - angle
		);
		glMatrix.vec2.normalize(this.state.velocity, this.state.velocity);
		glMatrix.vec2.scale(
			this.state.velocity,
			this.state.velocity,
			this.state.speed
		);
	}

	calculateMovement() {
		// const scaleCoefficient = Math.abs(
		// Math.sin(
		// (global.speedUpFactor *
		// this.state.scaleCoefficientFrequency *
		// global.timeFromStart *
		// 1000) /
		// 75
		// )
		// );

		// const scaleCoefficient =
		// 1 /
		// (1 +
		// Math.exp(
		// -2 *
		// 5 *
		// (Math.cos((2 * Math.PI * global.timeFromStart) / 0.5) -
		// Math.cos((Math.PI * 0.47) / 0.5))
		// ));

		const scaleCoefficient =
			1.1 /
				(1 +
					Math.exp(
						-2 *
							5 *
							(Math.cos((2 * Math.PI * global.timeFromStart) / 0.5) -
								Math.cos((Math.PI * 0.499) / 0.5))
					)) -
			((0.5 / Math.PI) *
				Math.sin(((2 * Math.PI * 1) / 0.5) * global.timeFromStart)) /
				1 +
			((0.5 / Math.PI) *
				Math.sin(((2 * Math.PI * 2) / 0.5) * global.timeFromStart)) /
				2 -
			((0.5 / Math.PI) *
				Math.sin(((2 * Math.PI * 3) / 0.5) * global.timeFromStart)) /
				3 +
			((0.5 / Math.PI) *
				Math.sin(((2 * Math.PI * 4) / 0.5) * global.timeFromStart)) /
				4;

		const movement = glMatrix.vec2.fromValues(...this.state.velocity);
		glMatrix.vec2.scale(
			movement,
			movement,
			scaleByDeltaTime(this.state.speed / 7)
		);

		return {
			movement,
			scaleCoefficient,
		};
	}

	move() {
		const { scaleCoefficient, movement } = this.calculateMovement();

		if (Math.random() < scaleByDeltaTime(0.01)) {
			this.changeDirection();
		}

		glMatrix.vec2.add(this.state.position, this.state.position, movement);
		this.state.projectedSize = this.state.size + 3 * scaleCoefficient;
	}

	scheduleStartMovingInRandomDirection() {
		if (this.state.restartMovementTimeout) {
			clearTimeout(this.state.restartMovementTimeout);
		}

		this.state.restartMovementTimeout = setTimeout(() => {
			this.state.scaleCoefficientFrequency = 1;
			this.state.restartMovementTimeout = undefined;
			this.startMoving();
		}, Math.floor((Math.random() * 5000) / scaleByDeltaTime(1)));
	}

	scheduleRotateVelocityAndMove(velX, velY) {
		if (this.state.rotateVelocityAndMoveTimeout) {
			clearTimeout(this.state.rotateVelocityAndMoveTimeout);
		}

		this.state.rotateVelocityAndMoveTimeout = setTimeout(() => {
			this.state.scaleCoefficientFrequency = 1;
			this.state.rotateVelocityAndMoveTimeout = undefined;

			this.state.velocity = glMatrix.vec2.fromValues(velX, velY);

			glMatrix.vec2.normalize(this.state.velocity, this.state.velocity);

			glMatrix.vec2.rotate(
				this.state.velocity,
				this.state.velocity,
				[0, 0],
				Math.PI
			);
		}, Math.floor((Math.random() * 500) / scaleByDeltaTime(1)));
	}

	stop() {
		this.state.scaleCoefficientFrequency = 0.3;
		this.state.previousVelocity = [...this.state.velocity];
		glMatrix.vec2.zero(this.state.velocity);
	}

	checkEnvironment() {
		const { movement } = this.calculateMovement();
		const nextPosition = glMatrix.vec2.fromValues(0, 0);
		glMatrix.vec2.add(nextPosition, this.state.position, movement);

		if (
			(nextPosition[0] < 0 && this.state.velocity[0] < 0) ||
			(nextPosition[0] > this.environment.width &&
				this.state.velocity[0] > 0) ||
			(nextPosition[1] < 0 && this.state.velocity[1] < 0) ||
			(nextPosition[1] > this.environment.height &&
				this.state.velocity[1] > 0) ||
			this.environment.isWater(
				Math.floor(nextPosition[0]),
				Math.floor(nextPosition[1])
			)
		) {
			this.stop();
			this.scheduleRotateVelocityAndMove(...this.state.previousVelocity);
		}
	}
}
