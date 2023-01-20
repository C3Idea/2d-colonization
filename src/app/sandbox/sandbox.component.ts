import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ColonizationModel, ColonizationMode } from '../colonization-model';
import { Mask } from '../mask';
import { SandboxStrings } from './sandbox.strings';
import { ColonizationViewer } from '../colonization-viewer';


@Component({
  selector: 'app-main',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.css']
})

export class SandboxComponent implements AfterViewInit {
  SandboxStrings = SandboxStrings;
  
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

  colonizationMode: ColonizationMode = ColonizationMode.Open;

  numAttractors: number = 250;
  numNodes: number = 1;
  
  backgroundColor = 'black';
  attractionColor = 'green';
  pruneColor      = 'red';
  nodeColor       = 'grey';
  segmentColor    = 'grey';

  toggleSwitchChecked: boolean = false;

  allMaskPaths: Array<string> = [
    "./assets/masks/elipse.png",
    "./assets/masks/ampersand.png",
    "./assets/masks/rectas.png"
  ];
  maskPath: string = this.allMaskPaths[0];
  mask!: Mask;

  viewer: ColonizationViewer;

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.drawMaskImage();
    this.initializeMask();
    this.viewer.model.update(this.mask);
    this.viewer.drawScene();
  }

  constructor() {
    this.viewer = new ColonizationViewer(undefined);
  }

  ngAfterViewInit(): void {
    this.viewer.setCanvas(this.canvas);
    this.viewer.setMaskCanvas(this.maskCanvas);
    this.fixCanvasDimensions();
  }

  private drawMaskImage() {
    this.viewer.drawMaskImage(this.maskImage);
  }

  private fixCanvasDimensions() {
    this.canvas.width  = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.maskCanvas.width  = this.maskCanvas.clientWidth;
    this.maskCanvas.height = this.maskCanvas.clientHeight;
  }

  private initializeMask() {
    const maskCtx = this.maskCanvas.getContext("2d");
    if (maskCtx) {
      const data = maskCtx.getImageData(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.mask  = Mask.fromImageData(data);
    }
  }

  maskImageLoad(event: Event) {
    this.viewer.clearCanvas();
    this.drawMaskImage();
    this.initializeMask();
    this.viewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.colonizationMode, false);
  }

  parameterChange(event: Event) {
    if (!this.viewer.isRunning) {
      this.viewer.drawScene();
    }
  }

  draw(event: Event): void {
    if (!this.viewer.isRunning) {
      this.viewer.drawScene();
    }
  }

  clickResetButton(event: Event) {
    this.viewer.clearElements();
    this.viewer.drawScene();
  }

  async clickGoButton(event: Event) {
    await this.run();
  }

  async run(): Promise<void> {
    await this.viewer.run();
  }

  private createNewAttractor(cx: number, cy: number) {
    const rect = this.canvas.getBoundingClientRect();
    const x = cx - rect.left;
    const y = cy - rect.top;
    if (this.viewer.model.createAttractor(x, y)) {
      this.resumeColonization();
    }
  }

  createNewNode(cx: number, cy: number) {
    const x = cx - this.canvas.clientLeft;
    const y = cy - this.canvas.clientTop;
    if (this.viewer.model.createNode(x, y)) {
      this.resumeColonization();
    }
  }

  contextMenu(event: Event): boolean {
    return false;
  }

  resumeColonization() {
    if (!this.viewer.isRunning) {
      this.run();
    }
  }

  async generateRandomAttractors(event: Event) {
    this.viewer.model.randomizeInteriorAttractors(this.numAttractors);
    this.viewer.drawScene();
    return this.resumeColonization();
  }

  async generateRandomNodes(event: Event) {
    this.viewer.model.randomizeInteriorNodes(this.numNodes);
    this.viewer.drawScene();
    return this.resumeColonization();
  }

  maskSelectChange(event: Event) {
    const index = (event.target as HTMLSelectElement).selectedIndex;
    this.maskPath = this.allMaskPaths[index];
  }

  modeSelectChange(event: Event) {
    if (this.mask) {
      this.viewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, this.colonizationMode, false);
      this.viewer.drawScene();
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
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width  = this.canvas.clientWidth;
    tempCanvas.height = this.canvas.clientHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(this.maskCanvas, 0, 0);
      tempCtx.drawImage(this.canvas, 0, 0);
    }
    this.savePNG(tempCanvas.toDataURL("image/png", 1.0), name); 
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

  canvasMouseDown(event: MouseEvent): void {
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    if (this.visualizationMenuVisible) {
      this.hideVisualizationMenu();
    }
    if (this.toggleSwitchChecked) {
      this.createNewNode(event.clientX, event.clientY);
    }
    else {
      this.createNewAttractor(event.clientX, event.clientY);
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
