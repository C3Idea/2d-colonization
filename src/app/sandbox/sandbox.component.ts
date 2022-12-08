import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ColonizationModel, ColonizationMode } from '../colonization-model';
import { sleep } from '../util';
import { Mask } from '../mask';
import { AppStrings } from '../app-strings';
import { ColonizationViewer } from '../colonization-viewer';


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

  colonizationMode: ColonizationMode = ColonizationMode.Open;

  numAttractors: number = 250;
  numNodes: number = 1;
  
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

  private maskCtx!: CanvasRenderingContext2D | null;

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
    this.viewer = new ColonizationViewer();
  }

  ngAfterViewInit(): void {
    this.viewer.setContext(this.canvas);
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
    this.canvas.width = w;
    this.canvas.height = h;
    this.maskCanvas.width = w;
    this.maskCanvas.height = h;
  }

  private initializeMask() {
    if (this.maskCtx) {
      this.maskCtx.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height, 0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      const data = this.maskCtx.getImageData(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.mask  = Mask.fromImageData(data);
    }
  }

  maskImageLoad(event: Event) {
    this.viewer.clear();
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