import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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

  viewer: ColonizationViewer;

  lettersPath: string = "./assets/letters";

  inputText: string;
  parametersMenuVisible: boolean = false;

  mask: Mask;

  constructor(private router: Router) {
    this.inputText = "";
    this.mask = new Mask(0, 0);
    this.viewer = new ColonizationViewer(this.mask);
  }

  ngAfterViewInit(): void {
    this.viewer.setCanvas(this.canvas);
    this.viewer.setMaskCanvas(this.maskCanvas);
    this.fixCanvasDimensions();
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
  }

  canvasContextMenu(event: Event): boolean {
    return false;
  }

  buttonParametersMenuClick(event: Event) {
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

  buttonCreateMaskClick(event: Event) {
    this.clearMaskCanvas();
    let n = this.inputText.length;
    const w = this.maskCanvas.clientWidth;
    const h = this.maskCanvas.clientHeight;
    for (let i = 0; i < n; i++) {
      const c = this.inputText.charAt(i);
      const cpath = this.lettersPath + "/" + "A.png";
      const img = new Image();
      const ctx = this.maskCanvas.getContext("2d");
      img.onload = function() {
        console.log(this, this);
        if (ctx) {
          const cw = i * w / n;
          ctx.drawImage(img, 0, 0, img.width, img.height, cw, 0, w / n, h);
        }
      }
      img.src = cpath;
    }
  }

  buttonPreviousClick(event: Event) {
    this.navigateToSandbox();
  }

  private navigateToSandbox() {
    this.router.navigate(["sandbox"]);
  }
}
