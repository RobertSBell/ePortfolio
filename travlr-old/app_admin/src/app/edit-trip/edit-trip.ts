import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-trip.html',
  styleUrl: './edit-trip.css',
})
export class EditTrip implements OnInit {
  editForm!: FormGroup;
  trip!: Trip;
  submitted = false;
  message: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private tripData: TripData,
    private route: ActivatedRoute
  ) {}

  originalCode!: string;

  ngOnInit(): void {

  const tripCode = this.route.snapshot.paramMap.get('code');

  if (!tripCode) {
    this.router.navigate(['']);
    return;
  }
  
  this.originalCode = tripCode;

  this.editForm = this.formBuilder.group({
    _id: [],
    code: [tripCode, Validators.required],
    name: ['', Validators.required],
    length: ['', Validators.required],
    start: ['', Validators.required],
    resort: ['', Validators.required],
    perPerson: ['', Validators.required],
    image: ['', Validators.required],
    description: ['', Validators.required],
  });

  this.tripData.getTrip(tripCode).subscribe({
    next: (value: Trip) => {
      
        console.log("Trip object:", value);
        console.log("trip.start:", value.start);
        console.log("typeof trip.start:", typeof value.start);
        console.log("instanceof Date:", value.start instanceof Date);
      this.trip = value;

      this.editForm.patchValue({
        ...value,
        start: new Date(value.start).toISOString().split('T')[0] // Format the date to YYYY-MM-DD
      })

      this.message = `Trip ${tripCode} retrieved successfully.`;

    },
    error: (err) => {
      console.error(err);
      this.message = 'Trip not found.';
    }
  });
}

  public onSubmit()
  {
    const updatedTrip: Trip = {
    ...this.editForm.value,
    start: new Date(this.editForm.value.start)
  };

  this.tripData.updateTrip(this.originalCode, updatedTrip)
    .subscribe({
        next: () => this.router.navigate(['']),
        error: err => console.error(err)
    });
  }

  get f() {
    return this.editForm.controls;
  }
}

