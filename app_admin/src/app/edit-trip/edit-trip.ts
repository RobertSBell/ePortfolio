import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripData } from '../services/trip-data';
import { Trip } from '../models/trip';

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
    private tripData: TripData
  ) {}

  ngOnInit(): void {
    // Retrieve stashed trip ID
    let tripCode = localStorage.getItem("tripCode");
      if (!tripCode) {
      alert("Something wrong, couldn't find where I stashed tripCode!");
      this.router.navigate(['']);
    return;
    }
console.log('EditTripComponent::ngOnInit');
console.log('tripcode:' + tripCode);
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
    })

    this.tripData.getTrip('tripCode')
    .subscribe({
      next: (value: any) => {
        this.trip = value;
        this.editForm.patchValue(value[0]);
        if(!value){
          this.message = 'No trip found with the provided code.';
        }else{
          this.message = 'Trip ' + tripCode + ' retrieved successfully.';}
      }
    })
  }

  public onSubmit()
  {
    this.submitted = true;
    if (this.editForm.valid) {
      const tripCode = this.editForm.get('code')?.value;
      this.tripData.updateTrip(tripCode, this.editForm.value)
      .subscribe({
        next: (value: any) => {
          console.log(value);
          this.router.navigate(['']);
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
      console.log('Edit form submitted', this.editForm.value);
    }
  }

  get f() {
    return this.editForm.controls;
  }
}

