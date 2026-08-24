import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { Router } from '@angular/router';

import { TripData } from '../services/trip-data';
import { AuthenticationService } from '../services/authentication';


@Component({
  selector: 'app-add-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-trip.html',
  styleUrl: './add-trip.css'
})
export class AddTrip implements OnInit {

  addForm!: FormGroup;

  submitted = false;

  errorMessage = '';


  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private tripService: TripData,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) { }


  public isLoggedIn() {
    return this.authenticationService.isLoggedIn();
  }


  ngOnInit() {

    this.addForm = this.formBuilder.group({

      _id: [],

      code: ['', Validators.required],

      name: ['', Validators.required],

      // Length is optional, but if entered must be
      // a positive integer.
      length: [
        '',
        [
          this.positiveIntegerValidator
        ]
      ],

      start: ['', Validators.required],

      end: [''],

      resort: ['', Validators.required],

      // Star rating is optional.
      // If entered: 1 through 5, maximum one decimal place.
      starRating: [
        '',
        [
          this.starRatingValidator
        ]
      ],

      perPerson: [
        '',
        [
          Validators.required,
          this.priceValidator
        ]
      ],

      image: ['', Validators.required],

      description: ['', Validators.required]

    });

    


    /*
     * LENGTH / END DATE
     *
     * If the user enters a length:
     *   - calculate end date
     *   - disable end date
     *
     * If the user clears length:
     *   - clear end date
     *   - enable end date
     */

    this.addForm.get('length')?.valueChanges.subscribe(() => {

      const lengthValue =
        this.addForm.get('length')?.value;

      const endControl =
        this.addForm.get('end');

      if (lengthValue !== '' &&
          lengthValue !== null &&
          lengthValue !== undefined) {

        endControl?.disable({
          emitEvent: false
        });

        this.calculateEndDate();

      } else {

        endControl?.enable({
          emitEvent: false
        });

        endControl?.setValue('', {
          emitEvent: false
        });
      }

    });


    /*
     * If the user enters an end date:
     *   - calculate length
     *   - disable length
     *
     * If the user clears end date:
     *   - enable length
     */

    this.addForm.get('end')?.valueChanges.subscribe(() => {

      const endValue =
        this.addForm.get('end')?.value;

      const lengthControl =
        this.addForm.get('length');


      if (endValue !== '' &&
          endValue !== null &&
          endValue !== undefined) {

        lengthControl?.disable({
          emitEvent: false
        });

        this.calculateLength();

      } else {

        lengthControl?.enable({
          emitEvent: false
        });

      }

    });

  }


  /*
   * Validator for positive integers.
   *
   * Valid:
   *   1
   *   2
   *   10
   *
   * Invalid:
   *   0
   *   -1
   *   2.5
   *   1.2
   */

  private positiveIntegerValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;

    // Empty is allowed because Length is optional.
    if (value === '' ||
        value === null ||
        value === undefined) {

      return null;
    }

    const numberValue = Number(value);

    if (
      !Number.isInteger(numberValue) ||
      numberValue <= 0
    ) {
      return {
        positiveInteger: true
      };
    }

    return null;
  }


  /*
   * Validator for Star Rating.
   *
   * Valid:
   *   1
   *   1.5
   *   4.5
   *   5
   *
   * Invalid:
   *   0
   *   0.5
   *   5.1
   *   6
   *   4.55
   */

  private starRatingValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;

    // Star rating is optional.
    if (value === '' ||
        value === null ||
        value === undefined) {

      return null;
    }

    const stringValue = String(value);

    const numberValue = Number(value);


    // Must be between 1 and 5.
    if (
      numberValue < 1 ||
      numberValue > 5
    ) {

      return {
        starRatingRange: true
      };

    }


    // Maximum one decimal place.
    if (!/^\d+(\.\d)?$/.test(stringValue)) {

      return {
        starRatingDecimal: true
      };

    }


    return null;
  }

  /*
   * Validator for Price Per Person.
   *
   * Valid:
   *   1
   *   1.55
   *   4.5
   *   5
   *
   * Invalid:
   *   0
   *   0.555
   *   5.156
   *   -100
   *   4.554
   */
  private priceValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;

    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const numberValue = Number(value);

    // Price must be greater than zero.
    if (numberValue <= 0) {
      return {
        pricePositive: true
      };
    }

    // Maximum two decimal places.
    const stringValue = String(value);

    if (!/^\d+(\.\d{1,2})?$/.test(stringValue)) {
      return {
        priceDecimal: true
      };
    }

    return null;
}


  private calculateEndDate(): void {

    const startValue =
      this.addForm.get('start')?.value;

    const lengthValue =
      Number(this.addForm.get('length')?.value);


    if (
      startValue &&
      Number.isInteger(lengthValue) &&
      lengthValue > 0
    ) {

      const end =
        new Date(startValue + 'T00:00:00');


      end.setDate(
        end.getDate() + lengthValue
      );


      this.addForm.patchValue({

        end: this.formatDateForInput(end)

      }, {
        emitEvent: false
      });

    }

  }


  private calculateLength(): void {

    const startValue =
      this.addForm.get('start')?.value;

    const endValue =
      this.addForm.get('end')?.value;


    if (startValue && endValue) {

      const start =
        new Date(startValue + 'T00:00:00');

      const end =
        new Date(endValue + 'T00:00:00');


      const difference =
        end.getTime() - start.getTime();


      const length =
        Math.round(
          difference /
          (1000 * 60 * 60 * 24)
        );


      this.addForm.patchValue({

        length: length

      }, {
        emitEvent: false
      });

    }

  }


  private formatDateForInput(date: Date): string {

    return date
      .toISOString()
      .split('T')[0];

  }


  public onSubmit(): void {

    this.errorMessage = '';

    this.submitted = true;


    if (this.addForm.invalid) {

      this.addForm.markAllAsTouched();

      return;
    }


    /*
     * getRawValue() is important here because the calculated
     * Length or End Date field may be disabled.
     *
     * Disabled controls are excluded from form.value.
     */

    const formValue =
      this.addForm.getRawValue();


    const newTrip = {

      ...formValue,

      start:
        new Date(formValue.start),

      end:
        formValue.end
          ? new Date(formValue.end)
          : undefined

    };


    console.log(
      'Submitting trip:',
      newTrip
    );


    this.tripService
      .addTrip(newTrip)
      .subscribe({

        next: (data: any) => {

          console.log(
            'Trip added successfully:',
            data
          );

          this.router.navigate(['']);

        },


        error: (error: any) => {

          console.error(
            'Add trip error:',
            error
          );


          if (error.status === 409) {

            this.errorMessage =
              error.error?.message ||
              'A trip with this code already exists.';

          } else {

            this.errorMessage =
              'An error occurred while adding the trip.';

          }


          this.cdr.detectChanges();

        }

      });

  }


  get f() {

    return this.addForm.controls;

  }

}