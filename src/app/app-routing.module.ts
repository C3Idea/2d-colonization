import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LettersComponent } from './letters/letters.component';
import { SandboxComponent } from './sandbox/sandbox.component';

const routes: Routes = [
  {
    path: "",
    redirectTo: "landing",
    pathMatch: "full"
  },
  {
    path: "landing",
    component: LandingComponent,
  },
  {
    path: "sandbox",
    component: SandboxComponent
  },
  {
    path: "letters",
    component: LettersComponent
  }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
