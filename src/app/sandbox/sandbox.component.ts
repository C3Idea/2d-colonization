import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ColonizationModel, ColonizationMode } from '../colonization-model';
import { Node } from '../node';
import { Attractor } from '../attractor';
import { loadImage, sleep } from '../util';
import Vec2 from 'vec2';
import { Mask } from '../mask';
import { AppStrings } from '../app-strings';


@Component({
  selector: 'app-main',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.css']
})

export class SandboxComponent implements AfterViewInit {
  AppStrings = AppStrings;
  
  @ViewChild("canvas")
  private canvasRef!: ElementRef;
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  @ViewChild("maskCanvas")
  private maskCanvasRef!: ElementRef;
  private get maskCanvas(): HTMLCanvasElement {
    return this.maskCanvasRef.nativeElement;
  }

  @ViewChild("maskImage")
  private maskImageRef!: ElementRef;
  private get maskImage(): HTMLImageElement {
    return this.maskImageRef.nativeElement;
  }

  @ViewChild("parametersMenu")
  private parametersMenuRef!: ElementRef;
  private get parametersMenu(): HTMLFormElement {
    return this.parametersMenuRef.nativeElement;
  }

  @ViewChild("visualizationMenu")
  private visualizationMenuRef!: ElementRef;
  private get visualizationMenu(): HTMLFormElement {
    return this.visualizationMenuRef.nativeElement;
  }

  parametersMenuVisible: boolean = false;
  visualizationMenuVisible: boolean = false;

  model!: ColonizationModel;

  colonizationMode: ColonizationMode = ColonizationMode.Open;

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
    "./assets/masks/elipse.png",
    "./assets/masks/ampersand.png",
    "./assets/masks/rectas.png"
  ];
  maskPath: string = this.allMaskPaths[0];
  mask!: Mask;

  private ctx!: CanvasRenderingContext2D | null;
  private maskCtx!: CanvasRenderingContext2D | null;

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.drawMaskImage();
    this.initializeMask();
    if (this.mask) {
      this.model.update(this.mask);
    }
    this.drawScene();
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.getContext("2d");
    this.maskCtx = this.maskCanvas.getContext("2d");
    this.fixCanvasDimensions();
  }

  private drawMaskImage() {
    if (this.maskCtx) {
      this.maskCtx.clearRect(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.maskCtx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
        0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
    }
  }

  private fixCanvasDimensions() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width  = w;
      this.canvas.height = h;
    }
    if (this.maskCanvas.width !== w || this.maskCanvas.height !== h) {
      this.maskCanvas.width  = w;
      this.maskCanvas.height = h;
    }
  }

  private initializeMask() {
    if (this.maskCtx) {
      this.maskCtx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height, 0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      const data = this.maskCtx.getImageData(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.mask  = Mask.fromImageData(data);
    }
  }

  maskImageLoad(event: Event) {
    this.clearCanvas();
    this.drawMaskImage();
    this.initializeMask();
    this.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.colonizationMode);
  }

  private clearCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }
  }

  parameterChange(event: Event) {
    if (!this.isRunning) {
      this.drawScene();
    }
  }

  draw(event: Event): void {
    if (!this.isRunning) {
      this.drawScene();
    }
  }


  private drawScene(): void {
    this.clearCanvas();
    if (this.model) {
      this.drawAttractors();
      this.drawSegments();
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
        this.ctx.ellipse(cx, cy, 2, 2, 0, 0, Math.PI * 2);
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
    this.drawScene();
  }

  async clickGoButton(event: Event) {
    await this.run();
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

  private createNewAttractor(cx: number, cy: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = cx - rect.left;
    const y = cy - rect.top;
    if (this.model.createAttractor(x, y)) {
      this.resumeColonization();
    }
  }

  createNewNode(cx: number, cy: number) {
    const x = cx - this.canvas.clientLeft;
    const y = cy - this.canvas.clientTop;
    let n = new Node();
    if (this.model.createNode(x, y)) {
      this.resumeColonization();
    }
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
  }

  modeSelectChange(event: Event) {
    if (this.mask) {
      this.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.colonizationMode);
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

  buttonParametersMenuClick(event: Event) {
    if (this.visualizationMenuVisible) {
      this.hideVisualizationMenu();
    }
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    else {
      this.showParametersMenu();
    }
  }

  private showParametersMenu() {
    this.parametersMenuVisible = true;
    this.parametersMenu.style.display = 'block';
  }

  private hideParametersMenu() {
    this.parametersMenuVisible = false;
    this.parametersMenu.style.display = 'none';
  }

  canvasMouseDownEvent(event: MouseEvent): void {
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    if (this.visualizationMenuVisible) {
      this.hideVisualizationMenu();
    }
    if (event.button == 0) { // Main button
      this.createNewAttractor(event.clientX, event.clientY);
    }
    else if (event.button == 2) { // Aux button
      this.createNewNode(event.clientX, event.clientY);
    }
  }

  canvasContextMenu(event: Event): boolean {
    return false;
  }

  visualizationMenuButtonClick(event: Event): void {
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    this.showVisualizationMenu();
  }

  private showVisualizationMenu() {
    this.visualizationMenu.style.display = 'block';
    this.visualizationMenuVisible = true;
  }

  private hideVisualizationMenu() {
    this.visualizationMenu.style.display = 'none';
    this.visualizationMenuVisible = false;
  }
}