import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ColonizationModel } from '../colonization-model';
import { Node } from '../node';
import { Attractor } from '../attractor';
import { loadImage, sleep } from '../util';
import Vec2 from 'vec2';
import { Mask } from '../mask';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})

export class MainComponent implements AfterViewInit {
  @ViewChild('canvas')
  private canvasRef!: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  model!: ColonizationModel;

  numAttractors: number = 250;
  numNodes: number = 1;
  attractionDistance: number = 128;
  pruneDistance: number = 16; 
  segmentLength: number = 2;
  
  showAttractionZone: boolean = true;
  showPruneZone: boolean = true;
  isRunning: boolean = false;
  isFresh:   boolean = true;

  randomAttractors: boolean = false;

  backgroundColor = 'black';
  attractionColor = 'green';
  pruneColor      = 'red';
  nodeColor       = 'grey';
  segmentColor    = 'grey';

  allMaskPaths: Array<string> = [
    "./assets/masks/elipse.png",
    "./assets/masks/ampersand.png",
    "./assets/masks/rectas.png"
  ];
  maskPath: string = this.allMaskPaths[0];
  maskImage: HTMLImageElement | undefined;

  private ctx!: CanvasRenderingContext2D | null; 

  constructor() {
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.getContext('2d');
    this.fixCanvasSize();
    this.setup();
  }

  draw(event: Event): void {
    if (!this.isRunning) {
      this.drawScene();
    }
  }

  private drawScene(): void {
    this.drawBackground();
    this.drawMaskImage();
    if (this.model) {
      this.drawAttractors();
      this.drawSegments();
    }
  }

  private drawBackground() {
    if (this.ctx != null) {
      this.ctx.beginPath();
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.closePath();
    }
  }

  private drawMaskImage() {
    if (this.ctx != null && this.maskImage != undefined) {
      this.ctx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
                                         0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private drawAttractors(): void {
    for (let a of this.model.attractors) {
      this.drawAttractor(a);
    }
  }

  private drawAttractor(a: Attractor): void {
    if (this.ctx != null) {
      if (this.showAttractionZone) {
        this.ctx.beginPath();
        this.ctx.ellipse(a.position.x, a.position.y, this.attractionDistance, this.attractionDistance, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.attractionColor;
        this.ctx.closePath();
        this.ctx.stroke();
      }
      if (this.showPruneZone) {
        this.ctx.beginPath();
        this.ctx.ellipse(a.position.x, a.position.y, this.pruneDistance, this.pruneDistance, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.pruneColor;
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  }

  private drawSegments(): void {
    for (let node of this.model.nodes) {
      this.drawNode(node);
    }
  }
  
  private drawNode(node: Node): void {
    if (this.ctx != null) {
      if (!this.isRunning && this.isFresh) {
        this.ctx.beginPath();
        this.ctx.ellipse(node.position.x, node.position.y, 3, 3, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
      }
      else {
        this.ctx.beginPath();
        this.ctx.ellipse(node.position.x, node.position.y, (1 + node.thickness) / this.segmentLength, (1 + node.thickness) / this.segmentLength, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
      }
      if (node.parent != undefined) {
        // Draw segment between node and node.parent
        this.ctx.moveTo(node.position.x, node.position.y);
        this.ctx.lineTo(node.parent.position.x, node.parent.position.y);
        this.ctx.lineWidth = 1 + node.parent.thickness;
        //ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.segmentColor;
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
    }
  }

  public clickResetButton(event: Event) {
    this.setup();
    this.drawScene();
  }

  public async clickGoButton(event: Event) {
    this.isRunning = true;
    await this.run();
    this.isRunning = false;
  }
  
  private setup(): void {
    this.isRunning = false;
    this.isFresh = true;
    const rect = this.canvas.getBoundingClientRect();
    this.loadMaskImage().then(result => {
      if (result) {
        this.maskImage = result;
        if (this.ctx != null) {
          this.ctx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
                                             0, 0, this.canvas.width, this.canvas.height);
          const data: ImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const mask = Mask.fromImageData(data);
          if (mask) {
            this.model = new ColonizationModel(mask.width, mask.height, mask);
          }
        }
        this.drawScene();
      }
    });
  }

  private async loadMaskImage() {
    return loadImage(this.maskPath);
  }

  private fixCanvasSize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    // If it's resolution does not match change it
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  async run(): Promise<void> {
    this.isFresh = false;
    while (true) {
      this.drawScene();
      if (!this.model.step(this.attractionDistance, this.pruneDistance, this.segmentLength)) {
        break;
      }
      await sleep(0);
    }
    this.drawScene();
    console.log("DONE!");
  }

  createNewAttractor(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let a = new Attractor();
    a.position = new Vec2(x, y);
    this.model.addAtractor(a);
    if (!this.isRunning) {
      this.drawScene();
    }
  }

  createNewNode(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let n = new Node();
    n.position = new Vec2(x, y);
    this.model.addNode(n);
    if (!this.isRunning) {
      this.drawScene();
    }
  }

  contextMenu(event: Event): boolean {
    return false;
  }

  generateRandomAttractors(event: Event) {
    this.model.randomizeInteriorAttractors(this.numAttractors);
    this.drawScene();
  }

  generateRandomNodes(event: Event) {
    this.model.randomizeInteriorNodes(this.numNodes);
    this.drawScene();
  }

  maskSelectChange(event: Event) {
    const index = (event.target as HTMLSelectElement).selectedIndex;
    this.maskPath = this.allMaskPaths[index];
    this.setup();
  }

}
