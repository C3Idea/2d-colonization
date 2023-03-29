import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ColonizationMode, ColonizationModel } from '../colonization-model';
import { ColonizationViewer } from '../colonization-viewer';
import { Mask } from '../mask';
import { LettersStrings } from './letters.strings';

@Component({
  selector: 'app-letters',
  templateUrl: './letters.component.html',
  styleUrls: ['./letters.component.css']
})
export class LettersComponent implements AfterViewInit {

  LettersStrings = LettersStrings;

  @ViewChild("mainContainer")
  private mainContainerRef!: ElementRef;
  private get mainContainer(): HTMLDivElement {
    return this.mainContainerRef.nativeElement;
  }

  @ViewChild("canvas0")
  private canvas0Ref!: ElementRef;
  private get canvas0(): HTMLCanvasElement {
    return this.canvas0Ref.nativeElement;
  }

  @ViewChild("maskCanvas0")
  private maskCanvas0Ref!: ElementRef;
  private get maskCanvas0(): HTMLCanvasElement {
    return this.maskCanvas0Ref.nativeElement;
  }

  @ViewChild("canvas1")
  private canvas1Ref!: ElementRef;
  private get canvas1(): HTMLCanvasElement {
    return this.canvas1Ref.nativeElement;
  }

  @ViewChild("maskCanvas1")
  private maskCanvas1Ref!: ElementRef;
  private get maskCanvas1(): HTMLCanvasElement {
    return this.maskCanvas1Ref.nativeElement;
  }

  @ViewChild("canvas2")
  private canvas2Ref!: ElementRef;
  private get canvas2(): HTMLCanvasElement {
    return this.canvas2Ref.nativeElement;
  }

  @ViewChild("maskCanvas2")
  private maskCanvas2Ref!: ElementRef;
  private get maskCanvas2(): HTMLCanvasElement {
    return this.maskCanvas2Ref.nativeElement;
  }

  @ViewChild("canvas3")
  private canvas3Ref!: ElementRef;
  private get canvas3(): HTMLCanvasElement {
    return this.canvas3Ref.nativeElement;
  }

  @ViewChild("maskCanvas3")
  private maskCanvas3Ref!: ElementRef;
  private get maskCanvas3(): HTMLCanvasElement {
    return this.maskCanvas3Ref.nativeElement;
  }

  @ViewChild("canvas4")
  private canvas4Ref!: ElementRef;
  private get canvas4(): HTMLCanvasElement {
    return this.canvas4Ref.nativeElement;
  }

  @ViewChild("maskCanvas4")
  private maskCanvas4Ref!: ElementRef;
  private get maskCanvas4(): HTMLCanvasElement {
    return this.maskCanvas4Ref.nativeElement;
  }

  @ViewChild("canvas5")
  private canvas5Ref!: ElementRef;
  private get canvas5(): HTMLCanvasElement {
    return this.canvas5Ref.nativeElement;
  }

  @ViewChild("maskCanvas5")
  private maskCanvas5Ref!: ElementRef;
  private get maskCanvas5(): HTMLCanvasElement {
    return this.maskCanvas5Ref.nativeElement;
  }

  @ViewChild("canvas6")
  private canvas6Ref!: ElementRef;
  private get canvas6(): HTMLCanvasElement {
    return this.canvas6Ref.nativeElement;
  }

  @ViewChild("maskCanvas6")
  private maskCanvas6Ref!: ElementRef;
  private get maskCanvas6(): HTMLCanvasElement {
    return this.maskCanvas6Ref.nativeElement;
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

  viewers!: Array<ColonizationViewer>;

  lettersPath: string = "./assets/letters";

  maxMaskLength: number;
  letters: Array<HTMLImageElement> = [];

  inputText!: string;
  parametersMenuVisible: boolean = false;
  visualizationMenuVisible: boolean = false;

  masks!: Array<Mask>;

  private numAttractors = 100;
  private attractionRadius = 128;
  private absorptionRadius = 2;
  private stepLength = 3;

  constructor(private router: Router) {
    this.maxMaskLength = 7;
    this.initializeValues();
  }

  private initializeValues() {
    this.inputText = "";
    this.masks = new Array<Mask>(this.maxMaskLength);
    this.viewers = new Array<ColonizationViewer>(this.maxMaskLength);
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.masks[i] = new Mask(0, 0);
      this.viewers[i] = new ColonizationViewer(this.masks[i]);
    }
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.createMasks();
    this.updateViewerModels();
    this.drawScenes();
  }

  private updateViewerModels() {
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].model.update(this.masks[i]);
    }
  }

  private drawScenes() {
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].drawScene();
    }
  }

  ngAfterViewInit(): void {
    this.setViewers();
    this.fixCanvasDimensions();
    this.showIntroWindow();
  }

  private setViewers() {
    this.viewers[0].setCanvas(this.canvas0);
    this.viewers[0].setMaskCanvas(this.maskCanvas0);
    this.viewers[1].setCanvas(this.canvas1);
    this.viewers[1].setMaskCanvas(this.maskCanvas1);
    this.viewers[2].setCanvas(this.canvas2);
    this.viewers[2].setMaskCanvas(this.maskCanvas2);
    this.viewers[3].setCanvas(this.canvas3);
    this.viewers[3].setMaskCanvas(this.maskCanvas3);
    this.viewers[4].setCanvas(this.canvas4);
    this.viewers[4].setMaskCanvas(this.maskCanvas4);
    this.viewers[5].setCanvas(this.canvas5);
    this.viewers[5].setMaskCanvas(this.maskCanvas5);
    this.viewers[6].setCanvas(this.canvas6);
    this.viewers[6].setMaskCanvas(this.maskCanvas6);
  }

  private fixCanvasDimensions() {
    this.canvas0.width  = this.canvas0.clientWidth;
    this.canvas0.height = this.canvas0.clientHeight;
    this.maskCanvas0.width  = this.maskCanvas0.clientWidth;
    this.maskCanvas0.height = this.maskCanvas0.clientHeight;
    this.canvas1.width  = this.canvas1.clientWidth;
    this.canvas1.height = this.canvas1.clientHeight;
    this.maskCanvas1.width  = this.maskCanvas1.clientWidth;
    this.maskCanvas1.height = this.maskCanvas1.clientHeight;
    this.canvas2.width  = this.canvas2.clientWidth;
    this.canvas2.height = this.canvas2.clientHeight;
    this.maskCanvas2.width  = this.maskCanvas2.clientWidth;
    this.maskCanvas2.height = this.maskCanvas2.clientHeight;
    this.canvas3.width  = this.canvas3.clientWidth;
    this.canvas3.height = this.canvas3.clientHeight;
    this.maskCanvas3.width  = this.maskCanvas3.clientWidth;
    this.maskCanvas3.height = this.maskCanvas3.clientHeight;
    this.canvas4.width  = this.canvas4.clientWidth;
    this.canvas4.height = this.canvas4.clientHeight;
    this.maskCanvas4.width  = this.maskCanvas4.clientWidth;
    this.maskCanvas4.height = this.maskCanvas4.clientHeight;
    this.canvas5.width  = this.canvas5.clientWidth;
    this.canvas5.height = this.canvas5.clientHeight;
    this.maskCanvas5.width  = this.maskCanvas5.clientWidth;
    this.maskCanvas5.height = this.maskCanvas5.clientHeight;
    this.canvas6.width  = this.canvas6.clientWidth;
    this.canvas6.height = this.canvas6.clientHeight;
    this.maskCanvas6.width  = this.maskCanvas6.clientWidth;
    this.maskCanvas6.height = this.maskCanvas6.clientHeight;
  }

  mainContainerClick(event: MouseEvent) {
    if (event.target == this.mainContainer) {
      if (this.parametersMenuVisible) {
        this.hideParametersMenu();
      }
      if (this.visualizationMenuVisible) {
        this.hideVisualizationMenu();
      } 
    }
  }

  canvasClick(event: Event) {
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
    tempCanvas.width  = this.letters.length * this.canvas0.clientWidth;
    tempCanvas.height = this.canvas0.clientHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      for (let i = 0; i < this.letters.length; i++) {
        const cx = i * this.canvas0.clientWidth;
        tempCtx.drawImage(this.viewers[i].getMaskCanvas(), cx, 0);
        tempCtx.drawImage(this.viewers[i].getCanvas(), cx, 0);
      }
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
    this.resetSimulation();
  }

  private resetSimulation() {
    this.stopAndClearSimulation();
    this.setupSimulation(); //
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].run();
    }
  }

  private setupSimulation() {
    for (let i = 0; i < this.letters.length; i++) {
      this.viewers[i].model.randomizeInteriorAttractors(this.numAttractors);
      this.viewers[i].model.randomizeInteriorNodes(1);
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

  private clearMaskCanvas() {
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].clearMaskCanvas();
    }
  }

  async buttonCreateMaskClick(event: Event) {
    if (this.inputText.length > 0) {
      this.stopAndClearSimulation();
      await this.downloadLetterImages();
      this.createMasks();
      // setupModels
      for (let i = 0; i < this.letters.length; i++) {
        this.viewers[i].model = new ColonizationModel(this.masks[i].width, this.masks[i].height, this.masks[i], ColonizationMode.Open, false);
        this.viewers[i].model.attractionRadius = this.attractionRadius;
        this.viewers[i].model.absorptionRadius = this.absorptionRadius;
        this.viewers[i].model.stepLength = this.stepLength;
        this.viewers[i].showAbsorptionZone = false;
        this.viewers[i].showAttractionZone = false;
        this.viewers[i].showAttractors = false;
      }
      this.setupSimulation();
      this.runSimulation();
    }
  }

  private runSimulation() {
    for (let i = 0; i < this.letters.length; i++) {
      this.viewers[i].run();
    }
  }

  private async downloadLetterImages() {
    const tempInputText = this.inputText.toUpperCase();
    //console.log(tempInputText);
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

  private createMasks() {
    this.clearMaskCanvas();
    const n = this.letters.length;
    for (let i = 0; i < n; i++) {
      const img = this.letters[i];
      this.viewers[i].drawMaskImage(img);
      const imgData = this.viewers[i].getMaskData();
      if (imgData) {
        this.masks[i] = Mask.fromImageData(imgData);
      }
    }
    for (let i = n; i < this.maxMaskLength; i++) {
      this.masks[i] = new Mask(0, 0);
    }
  }

  buttonPreviousClick(event: Event) {
    this.navigateToSandbox();
  }

  private navigateToSandbox() {
    // Stop process before navigation
    this.stopAndClearSimulation();
    this.router.navigate(["sandbox"]);
  }

  private stopSimulation() {
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].stop();
    }
  }

  private stopAndClearSimulation() {
    this.stopSimulation();
    this.clearSimulationElements();
  }

  private clearSimulationElements() {
    for (let i = 0; i < this.maxMaskLength; i++) {
      this.viewers[i].clearElements();
      this.viewers[i].clearCanvas();
    }
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
    if (this.visualizationMenuVisible) {
      this.hideVisualizationMenu();
    }
    else {
      this.showVisualizationMenu();
    }
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
    for (let i = 0; i < this.maxMaskLength; i++) {
      if (!this.viewers[i].isRunning) {
        this.viewers[i].drawScene();
      }
    }
  }
  
}
