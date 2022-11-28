import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ColonizationModel, ColonizationMode } from '../colonization-model';
import { Node } from '../node';
import { Attractor } from '../attractor';
import { loadImage, sleep, toNumber } from '../util';
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
  private backgroundCanvas!: HTMLCanvasElement;

  model!: ColonizationModel;
  selectedModeOption: ColonizationMode = ColonizationMode.Open;

  numAttractors: number = 250;
  numNodes: number = 1;
  attractionDistance: number = 128;
  pruneDistance: number = 16; 
  segmentLength: number = 2;
  
  showAttractionZone: boolean = true;
  showPruneZone: boolean = true;
  isRunning: boolean = false;
  isFresh:   boolean = true;

  autoResume: boolean = true;

  randomAttractors: boolean = false;

  backgroundColor = 'black';
  attractionColor = 'green';
  pruneColor      = 'red';
  nodeColor       = 'grey';
  segmentColor    = 'grey';

  allMaskPaths: Array<string> = [
    "./assets/masks/mask_ampersand.svg",
    "./assets/masks/mask_rectas.svg"
  ];
  maskPath: string = this.allMaskPaths[0];
  maskImage: HTMLImageElement | undefined;
  mask: Mask | undefined;

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
    this.drawMaskImage();
    if (this.model) {
      this.drawAttractors();
      this.drawSegments();
    }
  }

  private drawMaskImage() {
    if (this.ctx != null && this.maskImage != undefined) {
      this.ctx.drawImage(this.backgroundCanvas, 0, 0);
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
    const cx = node.position.x;
    const cy = node.position.y;
    if (this.ctx != null) {
      if (!this.isRunning) {
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, 3, 3, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
      }
      else {
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, (1 + node.thickness) / 2, (1 + node.thickness) / 2, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.nodeColor;
        this.ctx.closePath();
        this.ctx.fill();
      }
      if (node.parent != undefined) {
        // Draw segment between node and node.parent
        const pcx = node.parent.position.x;
        const pcy = node.parent.position.y;
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(pcx, pcy);
        this.ctx.lineWidth = 1 + node.parent.thickness;
        //this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.segmentColor;
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
    }
  }

  clickResetButton(event: Event) {
    this.setup();
    this.drawScene();
  }

  async clickGoButton(event: Event) {
    await this.run();
  }
  
  private setup(): void {
    this.isRunning = false;
    this.isFresh = true;
    const rect = this.canvas.getBoundingClientRect();
    this.loadMaskImage().then(result => {
      if (result) {
        this.maskImage = result;
        let tempCtx = this.backgroundCanvas.getContext('2d');
        if (tempCtx != null) {
          tempCtx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
            0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
          const data: ImageData = tempCtx.getImageData(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
          this.mask  = Mask.fromImageData(data);
          if (this.mask) {
            this.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.selectedModeOption);
          }
        }
        this.drawMaskImage();
      }
    });
  }

  private async loadMaskImage() {
    return loadImage(this.maskPath, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  private fixCanvasSize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    // If it's resolution does not match change it
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.backgroundCanvas = document.createElement('canvas');
    this.backgroundCanvas.width  = this.canvas.width;
    this.backgroundCanvas.height = this.canvas.height;
  }

  async run(): Promise<void> {
    this.isRunning = true;
    this.isFresh = false;
    while (true) {
      this.drawScene();
      if (!this.model.step(this.attractionDistance, this.pruneDistance, this.segmentLength)) {
        break;
      }
      await sleep(1);
    }
    this.drawScene();
    this.isRunning = false;
    console.log("DONE!");
  }

  createNewAttractor(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.model.createAttractor(x, y);
    this.resumeColonization();
  }

  createNewNode(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.model.createNode(x, y);
    this.resumeColonization();
  }

  contextMenu(event: Event): boolean {
    return false;
  }

  resumeColonization() {
    if (!this.isRunning && this.autoResume) {
      this.run();
    }
  }

  async generateRandomAttractors(event: Event) {
    this.model.randomizeInteriorAttractors(this.numAttractors);
    this.drawScene();
    return this.resumeColonization();
  }

  async generateRandomNodes(event: Event) {
    this.model.randomizeInteriorNodes(this.numNodes);
    this.drawScene();
    return this.resumeColonization();
  }

  maskSelectChange(event: Event) {
    const index = (event.target as HTMLSelectElement).selectedIndex;
    this.maskPath = this.allMaskPaths[index];
    this.setup();
  }

  modeSelectChange(event: Event) {
    if (this.mask) {
      this.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.selectedModeOption);
      this.drawScene();
    }
  }

  autoResumeChange(event: Event) {
    this.resumeColonization();
  }

  clickExportImage(event: Event): void {
    const date  = new Date();
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();
    const stamp = Math.round(date.getTime() / 1000);
    const name = `colonization-${year}${month}${day}_${stamp}`;
    this.savePNG(this.canvas.toDataURL("image/png", 1.0), name); 
  }

  private savePNG(path: string, name: string) {
    const link = document.createElement('a');
    link.setAttribute("download", name + '.png');
    link.setAttribute("href", path.replace("image/png", "image/octet-stream"));
    link.click();
  }

}
