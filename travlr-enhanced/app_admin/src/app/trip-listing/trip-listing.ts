import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripCard } from '../trip-card/trip-card';
import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AuthenticationService } from '../services/authentication';

// TripListing component displays a list of trips and provides functionality to add new trips
@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCard],
  templateUrl: './trip-listing.html',
  styleUrl: './trip-listing.css',
  //providers: [TripData]
})


export class TripListing implements OnInit, OnDestroy {
  trips!: Trip[];
  message: string = '';

  // constructor injects TripData service, Router, ChangeDetectorRef, and AuthenticationService
  constructor(private tripData: TripData, private router: Router, private cdr: ChangeDetectorRef, private authenticationService: AuthenticationService) {
    console.log('TripListing constructor called');
  }

  // isLoggedIn method checks if the user is logged in by calling the AuthenticationService
  public isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }

  // addTrip method navigates to the add-trip route
  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  

  // getStuff method retrieves the list of trips from the TripData service and updates the component's state
  private getStuff(): void {
    console.log('TripListing getStuff called');

    this.tripData.getTrips().subscribe({
      next: (value: any) => {
        console.log('TripListing received value from getTrips:', value);
        this.trips = Array.isArray(value) ? value : [];
        if (this.trips.length > 0) {
          this.message = 'There are ' + this.trips.length + ' trips available.';
        } else {
          this.message = 'There are no trips retrieved from the database.';
        }
        console.log('TripListing received trips:', this.trips);
        console.log(this.message);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.message = 'Failed to load trips.';
        console.error('Error loading trips:', error);
      }
    });
  }

  // ngOnInit lifecycle hook is called when the component is initialized, it calls getStuff to load trips
  ngOnInit(): void {
    console.log('TripListing ngOnInit called');
    this.getStuff();
  }

  // ngOnDestroy lifecycle hook is called when the component is destroyed, it logs a message
  ngOnDestroy(): void {
    console.log('TripListing ngOnDestroy called');
  }
}
