import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Overlays } from './shared/overlays';
import { AquaAssist } from './shared/aqua-assist';

@Component({ selector: 'app-root', imports: [RouterOutlet, Overlays, AquaAssist], template: `<router-outlet /><app-overlays /><app-aqua-assist />` })
export class App {}
