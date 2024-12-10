import Phaser from "phaser";

function getDyanmicBody(shape: unknown): Phaser.Physics.Arcade.Body {
  if (
    shape instanceof Phaser.GameObjects.GameObject &&
    shape.body instanceof Phaser.Physics.Arcade.Body
  ) {
    return shape.body;
  } else {
    throw new Error("Body not found");
  }
}

function isRect(x: unknown): x is Phaser.GameObjects.Rectangle {
  return x instanceof Phaser.GameObjects.Rectangle;
}

function getStaticBody(shape: unknown): Phaser.Physics.Arcade.StaticBody {
  if (
    shape instanceof Phaser.GameObjects.GameObject &&
    shape.body instanceof Phaser.Physics.Arcade.StaticBody
  ) {
    return shape.body;
  } else {
    throw new Error("Body not found");
  }
}

export class Example extends Phaser.Scene {
  private ball!: Phaser.GameObjects.Rectangle;
  private edgeRight!: Phaser.GameObjects.Rectangle;
  private edgeLeft!: Phaser.GameObjects.Rectangle;
  private edges!: Phaser.GameObjects.Group;
  private topWall!: Phaser.GameObjects.Rectangle;
  private bottomWall!: Phaser.GameObjects.Rectangle;
  private paddles!: Phaser.GameObjects.Group;

  private lastPoint = "paddleLeft";

  constructor() {
    super("Example");
  }

  private setupBall() {
    const bounds = this.physics.world.bounds;
    this.ball = this.add
      .rectangle(bounds.centerX, bounds.centerY, 16, 16)
      .setFillStyle(0xfefefe, 1)
      .setOrigin(0.5, 0.5)
      .setName("ball");
    this.physics.add.existing(this.ball, false);
    const body = getDyanmicBody(this.ball);
    body.mass = 10;
    body.collideWorldBounds = true;
    body.bounce.set(1, 1);
    body.velocity.set(250, 0);
  }

  private setupPaddles() {
    const bounds = this.physics.world.bounds;
    this.paddles = this.add.group();
    for (let i = 0; i < 2; i++) {
      const posX = bounds.centerX * 0.25 + bounds.width * 0.75 * i;
      const paddle = this.add
        .rectangle(posX, bounds.centerY, 8, 75)
        .setOrigin(0.5, 0.5)
        .setFillStyle(0xe3e3e3, 1);
      this.physics.add.existing(paddle, false);
      const body = getDyanmicBody(paddle);
      body.immovable = true;
      this.paddles.add(paddle);
    }
  }

  private setupEdges() {
    const bounds = this.physics.world.bounds;

    const wallSize = 10;
    this.edgeRight = this.add
      .rectangle(bounds.width, 0, wallSize, bounds.height)
      .setOrigin(1, 0)
      .setName("edgeRight");
    this.edgeLeft = this.add
      .rectangle(0, 0, wallSize, bounds.height)
      .setOrigin(0, 0)
      .setName("edgeLeft");
    const topWall = this.add
      .rectangle(
        bounds.centerX,
        bounds.centerY * 0.3,
        bounds.width * 0.75,
        wallSize
      )
      .setFillStyle(0xfefefe, 1)
      .setOrigin(0.5, 0.5);
    const bottomWall = this.add
      .rectangle(
        bounds.centerX,
        bounds.centerY * 1.7,
        bounds.width * 0.75,
        wallSize
      )
      .setFillStyle(0xfefefe, 1)
      .setOrigin(0.5, 0.5);
    this.edges = this.add.group();
    this.edges.add(topWall);
    this.edges.add(bottomWall);
    this.edges.add(this.edgeRight);
    this.edges.add(this.edgeLeft);

    this.topWall = topWall;
    this.bottomWall = bottomWall;

    for (const edge of this.edges.children.getArray()) {
      if (!(edge instanceof Phaser.GameObjects.Rectangle)) {
        throw new Error("Edge is not a rectangle");
      }
      this.physics.add.existing(edge, true);
      const edgeBody = getStaticBody(edge);
      edgeBody.immovable = true;
    }

    const baseHeight = topWall.y;
    const dividerHeight = (bottomWall.y - baseHeight) / 16;
    for (let i = 0; i < 8; i++) {
      this.add
        .rectangle(
          bounds.centerX,
          baseHeight + dividerHeight / 2 + i * dividerHeight * 2,
          8,
          dividerHeight
        )
        .setFillStyle(0xfefefe, 0.5)
        .setOrigin(0.5, 0);
    }
  }

  preload() {
    this.setupBall();
    this.setupEdges();
    this.setupPaddles();
    this.setupInputEvents();
  }

  private setupInputEvents() {
    if (!this.input.keyboard) {
      return;
    }
    const [paddleLeft, paddleRight] = this.paddles.children
      .getArray()
      .map((x) => (x instanceof Phaser.GameObjects.Rectangle ? x : null))
      .filter((x) => x !== null);
    const w = this.input.keyboard.addKey("W", false, true);
    const s = this.input.keyboard.addKey("S", false, true);
    const up = this.input.keyboard?.addKey("UP", false, true);
    const down = this.input.keyboard?.addKey("DOWN", false, true);
    w.on("down", movePaddle);
    s.on("down", movePaddle);
    up.on("down", movePaddle);
    down.on("down", movePaddle);
    this.input.keyboard?.addKey("SPACE", false, true).on("down", () => {
      const ballBody = getDyanmicBody(this.ball);
      const delta = this.lastPoint === "edgeRight" ? -1 : 1;
      if (ballBody.velocity.x === 0) {
        ballBody.velocity.x = 250 * delta;
      }
    });
    const topWall = this.topWall;
    const bottomWall = this.bottomWall;
    function movePaddle() {
      if (w.isDown && !s.isDown) {
        if (paddleLeft.y - paddleLeft.height / 2 <= topWall.y + 10) {
          return;
        }
        paddleLeft.y -= 8;
      }
      if (s.isDown && !w.isDown) {
        if (paddleLeft.y + paddleLeft.height / 2 >= bottomWall.y - 10) {
          return;
        }
        paddleLeft.y += 8;
      }
      if (up.isDown && !down.isDown) {
        if (paddleRight.y - paddleRight.height / 2 <= topWall.y + 10) {
          return;
        }
        paddleRight.y -= 8;
      }
      if (down.isDown && !up.isDown) {
        if (paddleRight.y + paddleRight.height / 2 >= bottomWall.y - 10) {
          return;
        }
        paddleRight.y += 8;
      }
    }
  }

  update(): void {
    const bounds = this.physics.world.bounds;
    this.physics.collide(this.ball, this.edges, (ball, wall) => {
      if (!isRect(wall) || !isRect(ball)) {
        return;
      }
      if (wall.name === "edgeRight" || wall.name === "edgeLeft") {
        this.lastPoint = wall.name;
        const ballBody = getDyanmicBody(ball);
        ballBody.x = bounds.centerX - ballBody.halfHeight;
        ballBody.y = bounds.centerY - ballBody.halfHeight;
        ballBody.stop();
      }
    });
    this.physics.collide(this.ball, this.paddles, (ball, paddle) => {
      const ballBody = getDyanmicBody(ball);
      const paddleBody = getDyanmicBody(paddle);
      const ballY = ballBody.y + ballBody.halfHeight;
      const paddleY = paddleBody.y + paddleBody.halfHeight;
      ballBody.velocity.y = (ballY - paddleY) * 2;
    });
  }
}
