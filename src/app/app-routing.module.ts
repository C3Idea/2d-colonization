import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { SandboxComponent } from './sandbox/sandbox.component';

const routes: Routes = [
  {
    path: "",
    component: LandingComponent
  },
  {
    path: "landing",
    component: LandingComponent
  },
  {
    path: "sandbox",
    component: SandboxComponent
  },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
