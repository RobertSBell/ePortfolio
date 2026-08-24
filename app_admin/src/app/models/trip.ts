// Trip model interface
export interface Trip {
    _id: string,
    code: string,
    name: string,
    length: number,
    start: Date,
    end: Date,
    resort: string,
    starRating: number,
    perPerson: number,
    image: string,
    description: string
}