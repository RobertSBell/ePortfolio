import { Routes } from '@angular/router';
import { TripListing } from './trip-listing/trip-listing';
import { AddTrip } from './add-trip/add-trip';
import { EditTrip } from './edit-trip/edit-trip';
import { Login } from './login/login';


export const routes: Routes = [
  { path: 'add-trip', component: AddTrip },
  { path: 'edit-trip/:code', component: EditTrip },
  { path: 'login', component: Login },
  { path: '', component: TripListing, pathMatch: 'full' }
];
