import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ColonizationMode, ColonizationModel } from '../colonization-model';
import { ColonizationViewer } from '../colonization-viewer';
import { Mask } from '../mask';
import { sleep } from '../util';

import { LandingStrings } from './landing.strings';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})

export class LandingComponent implements AfterViewInit {
  LandingStrings = LandingStrings;

  @ViewChild("leftCanvas")
  private leftCanvasRef!: ElementRef;
  private get leftCanvas(): HTMLCanvasElement {
    return this.leftCanvasRef.nativeElement;
  }

  @ViewChild("leftMaskCanvas")
  private leftMaskCanvasRef!: ElementRef;
  private get leftMaskCanvas(): HTMLCanvasElement {
    return this.leftMaskCanvasRef.nativeElement;
  }

  @ViewChild("middleCanvas")
  private middleCanvasRef!: ElementRef;
  private get middleCanvas(): HTMLCanvasElement {
    return this.middleCanvasRef.nativeElement;
  }

  @ViewChild("middleMaskCanvas")
  private middleMaskCanvasRef!: ElementRef;
  private get middleMaskCanvas(): HTMLCanvasElement {
    return this.middleMaskCanvasRef.nativeElement;
  }

  @ViewChild("rightCanvas")
  private rightCanvasRef!: ElementRef;
  private get rightCanvas(): HTMLCanvasElement {
    return this.rightCanvasRef.nativeElement;
  }

  @ViewChild("rightMaskCanvas")
  private rightMaskCanvasRef!: ElementRef;
  private get rightMaskCanvas(): HTMLCanvasElement {
    return this.rightMaskCanvasRef.nativeElement;
  }

  @ViewChild("maskImage")
  private maskImageRef!: ElementRef;
  private get maskImage(): HTMLImageElement {
    return this.maskImageRef.nativeElement;
  }

  maskPath: string = "./assets/masks/leaf.png";

  private mask: Mask;

  private numAttractors = 250;

  leftViewer:   ColonizationViewer;
  middleViewer: ColonizationViewer;
  rightViewer:  ColonizationViewer;

  constructor(private router: Router) {
    this.mask = new Mask(0, 0);
    this.leftViewer = new ColonizationViewer(this.mask);
    this.leftViewer.model.disturbDirection = false;
    this.middleViewer = new ColonizationViewer(this.mask);
    this.middleViewer.model.disturbDirection = false;
    this.rightViewer = new ColonizationViewer(this.mask);
    this.rightViewer.model.disturbDirection = false;
  }

  ngAfterViewInit() {
    this.leftViewer.setCanvas(this.leftCanvas);
    this.leftViewer.setMaskCanvas(this.leftMaskCanvas);
    this.middleViewer.setCanvas(this.middleCanvas);
    this.middleViewer.setMaskCanvas(this.middleMaskCanvas);
    this.rightViewer.setCanvas(this.rightCanvas);
    this.rightViewer.setMaskCanvas(this.rightMaskCanvas);
    this.fixCanvasDimensions();
  }

  private setupSimulation() {
    this.leftViewer.clearElements();
    this.middleViewer.clearElements();
    this.rightViewer.clearElements();
    this.createSeedNodes();
    this.createAttractors();
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.drawMaskImage();
    this.initializeMask();
    this.leftViewer.model.update(this.mask);
    this.middleViewer.model.update(this.mask);
    this.rightViewer.model.update(this.mask);
    this.drawScenes();
  }

  private drawScenes() {
    this.leftViewer.drawScene();
    this.middleViewer.drawScene();
    this.rightViewer.drawScene();
  }

  async maskImageLoad(event: Event): Promise<void> {
    this.leftViewer.clearCanvas();
    this.middleViewer.clearCanvas();
    this.rightViewer.clearCanvas();
    this.drawMaskImage();
    this.initializeMask();
    this.leftViewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, ColonizationMode.Closed, true, false);
    this.middleViewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, ColonizationMode.Closed, true, false);
    this.rightViewer.model = new ColonizationModel(this.mask.width, this.mask.height, this.mask, ColonizationMode.Closed, true, false);
    this.setupSimulation();
    await this.run();
  }

  private drawMaskImage() {
    this.leftViewer.drawMaskImage(this.maskImage);
    this.middleViewer.drawMaskImage(this.maskImage);
    this.rightViewer.drawMaskImage(this.maskImage);
  }

  private initializeMask() {
    const leftMaskCtx = this.leftMaskCanvas.getContext("2d");
    if (leftMaskCtx) {
      const data = leftMaskCtx.getImageData(0, 0, this.leftMaskCanvas.clientWidth, this.leftMaskCanvas.clientHeight);
      this.mask = Mask.fromImageData(data);
    }
  }
  private fixCanvasDimensions() {
    this.leftCanvas.width  = this.leftCanvas.clientWidth;
    this.leftCanvas.height = this.leftCanvas.clientHeight;
    this.leftMaskCanvas.width = this.leftMaskCanvas.clientWidth;
    this.leftMaskCanvas.height = this.leftMaskCanvas.clientHeight;
    this.middleCanvas.width  = this.middleCanvas.clientWidth;
    this.middleCanvas.height = this.middleCanvas.clientHeight;
    this.middleMaskCanvas.width  = this.middleMaskCanvas.clientWidth;
    this.middleMaskCanvas.height = this.middleMaskCanvas.clientHeight;
    this.rightCanvas.width  = this.rightCanvas.clientWidth;
    this.rightCanvas.height = this.rightCanvas.clientHeight;
    this.rightMaskCanvas.width  = this.rightMaskCanvas.clientWidth;
    this.rightMaskCanvas.height = this.rightMaskCanvas.clientHeight;
  }

  private createSeedNodes() {
    this.leftViewer.model.clearNodes();
    const lx = this.leftCanvas.clientWidth / 2;
    const ly = this.leftCanvas.clientHeight - 1;
    this.leftViewer.model.createNode(lx, ly);
    this.middleViewer.model.clearNodes();
    const mx = this.middleCanvas.clientWidth / 2;
    const my = this.middleCanvas.clientHeight - 1;
    this.middleViewer.model.createNode(mx, my);
    this.rightViewer.model.clearNodes();
    const rx = this.rightCanvas.clientWidth / 2;
    const ry = this.rightCanvas.clientHeight - 1;
    this.rightViewer.model.createNode(rx, ry);
  }

  private createAttractors() {
    this.leftViewer.model.clearAttractors();
    this.middleViewer.model.clearAttractors();
    this.rightViewer.model.clearAttractors();
    this.leftViewer.model.randomizeInteriorAttractors(this.numAttractors);
    this.middleViewer.model.copyAttractors(this.leftViewer.model.attractors);
    this.rightViewer.model.copyAttractors(this.leftViewer.model.attractors);
  }

  leftParameterChange(event: Event) {
    this.leftViewer.drawScene();
  }

  middleParameterChange(event: Event) {
    this.middleViewer.drawScene();
  }

  rightParameterChange(event: Event) {
    this.rightViewer.drawScene();
  }

  async run(): Promise<void> {
    await Promise.all([this.leftViewer.run(), this.middleViewer.run(), this.rightViewer.run()]);
    await sleep(5000);
    this.setupSimulation();
    await this.run();
  }

  buttonNextClick(event: Event) {
    this.navigateToSandbox();
  }
  
  private navigateToSandbox() {
    this.router.navigate(["sandbox"]);
  }

}
