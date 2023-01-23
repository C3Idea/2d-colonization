import { Attractor } from "./attractor";
import { Node } from "./node";
import { ColonizationMode, ColonizationModel } from "./colonization-model";
import { sleep } from "./util";
import { Mask } from "./mask";

export class ColonizationViewer {
  model: ColonizationModel;
  ctx:   CanvasRenderingContext2D | null;
  maskCtx: CanvasRenderingContext2D | null;
  showAttractionZone: boolean;
  showAbsorptionZone: boolean;

  isRunning: boolean;
  isFresh: boolean;

  attractionColor = "#00FF00";
  absorptionColor = "#FF0000";
  nodeColor       = "#A0A0A0";
  segmentColor    = '#A0A0A0';
  
  private canvas!: HTMLCanvasElement;
  private maskCanvas!: HTMLCanvasElement;

  constructor(mask: Mask | undefined) {
    this.ctx   = null;
    this.maskCtx = null;
    this.showAttractionZone = true;
    this.showAbsorptionZone = true;
    this.isRunning = false;
    this.isFresh   = true;
    if (mask) {
      this.model = new ColonizationModel(mask.width, mask.height, mask);
    }
    else {
      this.model = new ColonizationModel();
    }
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
  }

  setMaskCanvas(maskCanvas: HTMLCanvasElement) {
    this.maskCanvas = maskCanvas;
    this.maskCtx = this.maskCanvas.getContext("2d");
  }

  clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }
  }

  drawMaskImage(img: HTMLImageElement) {
    if (this.maskCtx) {
      this.maskCtx.clearRect(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.maskCtx.drawImage(img, 0, 0, img.width, img.height,
        0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
    }
  }

  drawScene() {
    this.clearCanvas();
    this.drawAttractors();
    if (this.isFresh) {
      this.drawNodes();
    }
    else {
      this.drawSegments();
    }
  }

  async run(): Promise<void> {
    this.isRunning = true;
    while (true) {
      this.drawScene();
      if (!this.model.step()) {
        break;
      }
      else {
        this.isFresh = false;
      }
      await sleep(1);
    }
    this.drawScene();
    this.isRunning = false;
    //console.log("Run finished!", this.model.nodes.length, this.model.attractors.length);
  }

  private drawAttractors(): void {
    for (let a of this.model.attractors) {
      this.drawAttractor(a);
    }
  }

  private drawAttractor(a: Attractor): void {
    if (this.ctx != null) {
      this.ctx.beginPath();
      this.ctx.ellipse(a.position.x, a.position.y, 3, 3, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = this.absorptionColor;
      this.ctx.closePath();
      this.ctx.fill();
      if (this.showAttractionZone) {
        this.ctx.beginPath();
        this.ctx.ellipse(a.position.x, a.position.y, this.model.attractionRadius, this.model.attractionRadius, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.attractionColor;
        this.ctx.closePath();
        this.ctx.stroke();
      }
      if (this.showAbsorptionZone) {
        this.ctx.beginPath();
        this.ctx.ellipse(a.position.x, a.position.y, this.model.absorptionRadius, this.model.absorptionRadius, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.absorptionColor;
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  }

  private drawSegments(): void {
    for (let node of this.model.nodes) {
      this.drawSegment(node);
    }
  }

  private drawNodes(): void {
    for (let node of this.model.nodes) {
      this.drawNode(node);
    }
  }

  private drawNode(n: Node) {
    if (this.ctx != null) {
      this.ctx.beginPath();
      this.ctx.ellipse(n.position.x, n.position.y, 3, 3, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = this.nodeColor;
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
  
  private drawSegment(node: Node): void {
    const cx = node.position.x;
    const cy = node.position.y;
    if (this.ctx != null) {
      if (node.parent != undefined) {
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, (1 + node.thickness) / 2, (1 + node.thickness) / 2, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
        // Draw segment between node and node.parent
        const pcx = node.parent.position.x;
        const pcy = node.parent.position.y;
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(pcx, pcy);
        this.ctx.lineWidth = 1 + node.parent.thickness;
        this.ctx.strokeStyle = this.segmentColor;
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
      else {
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, 3, 3, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }

  clearElements() {
    this.isRunning = false;
    this.isFresh   = true;
    this.model.clearElements();
  }

}
