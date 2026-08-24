import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripCard } from '../trip-card/trip-card';
import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AuthenticationService } from '../services/authentication';




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

  constructor(private tripData: TripData, private router: Router, private cdr: ChangeDetectorRef, private authenticationService: AuthenticationService) {
    console.log('TripListing constructor called');
  }

  public isLoggedIn()
  {
  return this.authenticationService.isLoggedIn();
  }

  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  


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

  ngOnInit(): void {
    console.log('TripListing ngOnInit called');
    this.getStuff();
  }
  ngOnDestroy(): void {
    console.log('TripListing ngOnDestroy called');
  }
}
