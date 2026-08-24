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

import { Router, ActivatedRoute } from '@angular/router';

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

  errorMessage = '';

  // Original code identifies the existing database record.
  originalCode!: string;


  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private tripData: TripData,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {

    const tripCode =
      this.route.snapshot.paramMap.get('code');


    if (!tripCode) {

      this.router.navigate(['']);

      return;
    }


    // Keep the original code so the PUT request knows
    // which existing trip is being edited.
    this.originalCode = tripCode;


    this.editForm = this.formBuilder.group({

      _id: [],

      code: [
        tripCode,
        Validators.required
      ],

      name: [
        '',
        Validators.required
      ],

      // Optional because End Date may be used instead.
      length: [
        '',
        this.positiveIntegerValidator
      ],

      start: [
        '',
        Validators.required
      ],

      end: [''],

      resort: [
        '',
        Validators.required
      ],

      // Optional, but validated if entered.
      starRating: [
        '',
        this.starRatingValidator
      ],

      perPerson: [
        '',
        [
          Validators.required,
          this.priceValidator
        ]
      ],

      image: [
        '',
        Validators.required
      ],

      description: [
        '',
        Validators.required
      ]

    });


    /*
     * Retrieve the existing trip.
     */

    this.tripData
      .getTrip(tripCode)
      .subscribe({

        next: (value: Trip) => {

          this.trip = value;


          const hasLength =
            value.length !== null &&
            value.length !== undefined;


          const hasEnd =
            value.end !== null &&
            value.end !== undefined;


          /*
           * If Length exists, Length is considered
           * the authoritative value.
           *
           * Therefore End Date is not populated.
           */

          this.editForm.patchValue({

            ...value,

            start:
              new Date(value.start)
                .toISOString()
                .split('T')[0],

            end:
              !hasLength && hasEnd
                ? new Date(value.end)
                    .toISOString()
                    .split('T')[0]
                : ''

          }, {
            emitEvent: false
          });


          /*
           * Make Length and End mutually exclusive.
           */

          if (hasLength) {

            this.editForm
              .get('end')
              ?.disable({
                emitEvent: false
              });

            this.calculateEndDate();

          }

          else if (hasEnd) {

            this.editForm
              .get('length')
              ?.disable({
                emitEvent: false
              });

          }


          /*
           * Watch Length for changes.
           */

          this.editForm
            .get('length')
            ?.valueChanges
            .subscribe(() => {

              const lengthValue =
                this.editForm
                  .get('length')
                  ?.value;

              const endControl =
                this.editForm.get('end');


              if (
                lengthValue !== '' &&
                lengthValue !== null &&
                lengthValue !== undefined
              ) {

                endControl?.disable({
                  emitEvent: false
                });

                this.calculateEndDate();

              }

              else {

                endControl?.enable({
                  emitEvent: false
                });

                endControl?.setValue('', {
                  emitEvent: false
                });

              }

            });


          /*
           * Watch End Date for changes.
           */

          this.editForm
            .get('end')
            ?.valueChanges
            .subscribe(() => {

              const endValue =
                this.editForm
                  .get('end')
                  ?.value;

              const lengthControl =
                this.editForm.get('length');


              if (
                endValue !== '' &&
                endValue !== null &&
                endValue !== undefined
              ) {

                lengthControl?.disable({
                  emitEvent: false
                });

                this.calculateLength();

              }

              else {

                lengthControl?.enable({
                  emitEvent: false
                });

              }

            });

        },


        error: (err) => {

          console.error(err);

          this.errorMessage =
            'Trip not found.';

          this.cdr.detectChanges();

        }

      });

  }


  /*
   * Length validator.
   *
   * Length is optional, but when entered it must
   * be a positive whole number.
   */

  private positiveIntegerValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;


    // Empty is allowed because End Date
    // can be used instead.
    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const numberValue =
      Number(value);


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
   * Star Rating validator.
   *
   * Optional.
   *
   * Valid:
   * 1
   * 1.5
   * 4
   * 4.5
   * 5
   *
   * Invalid:
   * 0
   * 0.5
   * 5.1
   * 6
   * 4.55
   */

  private starRatingValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;


    // Star rating is optional.
    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const numberValue =
      Number(value);


    /*
     * Check range first.
     */

    if (
      numberValue < 1 ||
      numberValue > 5
    ) {

      return {
        starRatingRange: true
      };

    }


    /*
     * Check decimal places.
     */

    const stringValue =
      String(value);


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


  /*
   * Calculate End Date from Start Date + Length.
   */

  private calculateEndDate(): void {

    const startValue =
      this.editForm
        .get('start')
        ?.value;

    const lengthValue =
      Number(
        this.editForm
          .get('length')
          ?.value
      );


    if (
      startValue &&
      Number.isInteger(lengthValue) &&
      lengthValue > 0
    ) {

      const end =
        new Date(
          startValue + 'T00:00:00'
        );


      end.setDate(
        end.getDate() + lengthValue
      );


      this.editForm.patchValue({

        end:
          this.formatDateForInput(end)

      }, {
        emitEvent: false
      });

    }

  }


  /*
   * Calculate Length from Start Date + End Date.
   */

  private calculateLength(): void {

    const startValue =
      this.editForm
        .get('start')
        ?.value;

    const endValue =
      this.editForm
        .get('end')
        ?.value;


    if (
      startValue &&
      endValue
    ) {

      const start =
        new Date(
          startValue + 'T00:00:00'
        );

      const end =
        new Date(
          endValue + 'T00:00:00'
        );


      const difference =
        end.getTime() - start.getTime();


      const length =
        Math.round(
          difference /
          (1000 * 60 * 60 * 24)
        );


      this.editForm.patchValue({

        length: length

      }, {
        emitEvent: false
      });

    }

  }


  private formatDateForInput(
    date: Date
  ): string {

    return date
      .toISOString()
      .split('T')[0];

  }


  /*
   * Submit the edited trip.
   */

  public onSubmit(): void {

    // Clear previous server error.
    this.errorMessage = '';

    // Mark form as submitted.
    this.submitted = true;


    /*
     * Stop if validation fails.
     */

    if (this.editForm.invalid) {

      this.editForm.markAllAsTouched();

      return;

    }


    /*
     * getRawValue() includes disabled controls.
     *
     * This is important because either Length
     * or End Date may be disabled.
     */

    const formValue =
      this.editForm.getRawValue();


    const updatedTrip: Trip = {

      ...formValue,

      start:
        new Date(formValue.start),

      end:
        formValue.end
          ? new Date(formValue.end)
          : undefined

    };


    console.log(
      'Submitting update:',
      updatedTrip
    );

    console.log(
      'Original code:',
      this.originalCode
    );


    this.tripData
      .updateTrip(
        this.originalCode,
        updatedTrip
      )
      .subscribe({

        next: (value: Trip) => {

          console.log(
            'Trip updated successfully:',
            value
          );

          this.router.navigate(['']);

        },


        error: (error: any) => {

          console.error(
            'Update error:',
            error
          );


          if (error.status === 409) {

            this.errorMessage =
              error.error?.message ||
              'A trip with this code already exists.';

          }

          else {

            this.errorMessage =
              'An error occurred while updating the trip.';

          }


          // Ensure the error appears immediately.
          this.cdr.detectChanges();

        }

      });

  }


  get f() {

    return this.editForm.controls;

  }

}