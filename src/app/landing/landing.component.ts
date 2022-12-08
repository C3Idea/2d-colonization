import { Component, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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

  @ViewChild("middleCanvas")
  private middleCanvasRef!: ElementRef;
  private get middleCanvas(): HTMLCanvasElement {
    return this.middleCanvasRef.nativeElement;
  }

  @ViewChild("rightCanvas")
  private rightCanvasRef!: ElementRef;
  private get rightCanvas(): HTMLCanvasElement {
    return this.rightCanvasRef.nativeElement;
  }

  private numAttractors = 250;

  leftViewer:   ColonizationViewer;
  middleViewer: ColonizationViewer;
  rightViewer:  ColonizationViewer;

  constructor() {
    this.leftViewer = new ColonizationViewer();
    //this.leftViewer.showAttractionZone = false;
    //this.leftViewer.showAbsorptionZone = false;
    this.leftViewer.model.disturbDirection = false;
    this.middleViewer = new ColonizationViewer();
    //this.middleViewer.showAttractionZone = false;
    //this.middleViewer.showAbsorptionZone = false;
    this.middleViewer.model.disturbDirection = false;
    this.rightViewer = new ColonizationViewer();
    //this.rightViewer.showAttractionZone = false;
    //this.rightViewer.showAbsorptionZone = false;
    this.rightViewer.model.disturbDirection = false;
  }

  async ngAfterViewInit(): Promise<void> {
    this.leftViewer.setContext(this.leftCanvas);
    this.middleViewer.setContext(this.middleCanvas);
    this.rightViewer.setContext(this.rightCanvas);
    this.fixCanvasDimensions();
    this.leftViewer.model.mask = new Mask(this.leftCanvas.clientWidth, this.leftCanvas.clientHeight);
    this.middleViewer.model.mask = new Mask(this.middleCanvas.clientWidth, this.middleCanvas.clientHeight);
    this.rightViewer.model.mask = new Mask(this.rightCanvas.clientWidth, this.rightCanvas.clientHeight);
    this.setupSimulation();
    await this.run();
  }

  private setupSimulation() {
    console.log("SETUP");
    this.leftViewer.clearElements();
    this.middleViewer.clearElements();
    this.rightViewer.clearElements();
    this.createSeedNodes();
    this.createAttractors();
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event: Event) {
    this.fixCanvasDimensions();
    this.leftViewer.model.update(new Mask(this.leftCanvas.clientWidth, this.leftCanvas.clientHeight));
    this.middleViewer.model.update(new Mask(this.middleCanvas.clientWidth, this.middleCanvas.clientHeight));
    this.rightViewer.model.update(new Mask(this.rightCanvas.clientWidth, this.rightCanvas.clientHeight));
    this.drawScenes();
  }

  private fixCanvasDimensions() {
    this.leftCanvas.width  = this.leftCanvas.clientWidth;
    this.leftCanvas.height = this.leftCanvas.clientHeight;
    this.middleCanvas.width  = this.middleCanvas.clientWidth;
    this.middleCanvas.height = this.middleCanvas.clientHeight;
    this.rightCanvas.width  = this.rightCanvas.clientWidth;
    this.rightCanvas.height = this.rightCanvas.clientHeight;
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

  private drawScenes() {
    this.leftViewer.drawScene();
    this.middleViewer.drawScene();
    this.rightViewer.drawScene();
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
    console.log(this.leftViewer.model);
    console.log(this.middleViewer.model);
    console.log(this.rightViewer.model);
    let i = 0;
    await Promise.all([this.leftViewer.run(), this.middleViewer.run(), this.rightViewer.run()]);

    await sleep(10000);

    this.setupSimulation();

    await this.run();
  }
  
}
