import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ColonizationMode, ColonizationModel } from '../colonization-model';
import { ColonizationViewer } from '../colonization-viewer';
import { Mask } from '../mask';

@Component({
  selector: 'app-letters',
  templateUrl: './letters.component.html',
  styleUrls: ['./letters.component.css']
})
export class LettersComponent implements AfterViewInit {

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

  @ViewChild("introWindow")
  private introWindowRef!: ElementRef;
  private get introWindow(): HTMLDivElement {
    return this.introWindowRef.nativeElement;
  }

  viewer!: ColonizationViewer;

  lettersPath: string = "./assets/letters";

  letters: Array<HTMLImageElement> = [];

  inputText!: string;
  parametersMenuVisible: boolean = false;
  visualizationMenuVisible: boolean = false;

  mask!: Mask;

  private numAttractors = 1000;
  private attractionRadius = 128;
  private absorptionRadius = 1;
  private stepLength = 2;

  constructor(private router: Router) {
    this.initializeValues();
  }

  private initializeValues() {
    this.inputText = "";
    this.mask = new Mask(0, 0);
    this.viewer = new ColonizationViewer(this.mask);
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.createMask();
    this.initializeMask();
    this.viewer.model.update(this.mask);
    this.viewer.drawScene();
  }

  ngAfterViewInit(): void {
    this.viewer.setCanvas(this.canvas);
    this.viewer.setMaskCanvas(this.maskCanvas);
    this.fixCanvasDimensions();
    this.showIntroWindow();
  }

  private fixCanvasDimensions() {
    this.canvas.width  = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.maskCanvas.width  = this.maskCanvas.clientWidth;
    this.maskCanvas.height = this.maskCanvas.clientHeight;
  }

  canvasMouseDown(event: Event) {
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    if (this.visualizationMenuVisible) {
      this.hideVisualizationMenu();
    }
  }

  canvasContextMenu(event: Event): boolean {
    return false;
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

  buttonExportImageClick(event: Event): void {
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

  buttonResetClick(event: Event) {
    this.viewer.clearElements();
    this.setupSimulation();
    this.viewer.run();
  }

  private setupSimulation() {
    this.viewer.model.randomizeInteriorAttractors(this.numAttractors);
    this.viewer.model.randomizeInteriorNodesWithinCoordinatesInDivisions(
      1, this.letters.length, 0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  private showParametersMenu() {
    this.parametersMenuVisible = true;
    this.parametersMenu.style.display = 'block';
  }

  private hideParametersMenu() {
    this.parametersMenuVisible = false;
    this.parametersMenu.style.display = 'none';
  }

  private clearMaskCanvas() {
    const ctx = this.maskCanvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
    }
  }

  async buttonCreateMaskClick(event: Event) {
    if (this.inputText.length > 0) {
      await this.downloadLetterImages();
      this.createMask();
      this.initializeMask();
      this.viewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, ColonizationMode.Open, false);
      this.viewer.model.attractionRadius = this.attractionRadius;
      this.viewer.model.absorptionRadius = this.absorptionRadius;
      this.viewer.model.stepLength = this.stepLength;
      this.viewer.showAbsorptionZone = false;
      this.viewer.showAttractionZone = false;
      this.viewer.showAttractors = false;
      this.setupSimulation();
      this.viewer.run();
    }
  }

  private async downloadLetterImages() {
    const tempInputText = this.inputText.toUpperCase();
    console.log(tempInputText);
    let n = this.inputText.length;
    this.letters = [];
    for (let i = 0; i < n; i++) {
      const c = tempInputText.charAt(i);
      const cpath = this.lettersPath + "/" + "char_" + c + "_mask.png";
      const img = new Image();
      this.letters.push(img);
      await new Promise(r => {
        img.onload = r;
        img.src    = cpath;
      });
    }
  }

  private createMask() {
    this.clearMaskCanvas();
    const ctx = this.maskCanvas.getContext("2d");
    const w = this.maskCanvas.clientWidth;
    const h = this.maskCanvas.clientHeight;
    const n = this.letters.length;
    if (ctx) {
      for (let i = 0; i < n; i++) {
        const img = this.letters[i];
        const cw = i * w / n;
        ctx.drawImage(img, 0, 0, img.width, img.height, cw, 0, w / n, h);
      }
    }
  }

  private initializeMask() {
    const maskCtx = this.maskCanvas.getContext("2d");
    if (maskCtx) {
      const data = maskCtx.getImageData(0, 0, this.maskCanvas.clientWidth, this.maskCanvas.clientHeight);
      this.mask  = Mask.fromImageData(data);
    }
  }

  buttonPreviousClick(event: Event) {
    this.navigateToSandbox();
  }

  private navigateToSandbox() {
    this.router.navigate(["sandbox"]);
  }

  introWindowClick(event: Event) {
    if (event.target == this.introWindow) {
      this.closeIntroWindow();
    }
  }

  introWindowButtonClose(event: Event) {
    this.closeIntroWindow();
  }

  private closeIntroWindow() {
    this.introWindow.style.display = "none";
  }


  buttonIntroClick(event: Event) {
    this.showIntroWindow();
  }

  private showIntroWindow() {
    this.introWindow.style.display = "block";
  }

  buttonVisualizationMenuClick(event: Event): void {
    if (this.parametersMenuVisible) {
      this.hideParametersMenu();
    }
    this.showVisualizationMenu();
  }

  private showVisualizationMenu() {
    this.visualizationMenu.style.display = "block";
    this.visualizationMenuVisible = true;
  }

  private hideVisualizationMenu() {
    this.visualizationMenu.style.display = "none";
    this.visualizationMenuVisible = false;
  }

  draw(event: Event) {
    if (!this.viewer.isRunning) {
      this.viewer.drawScene();
    }
  }
  
}
