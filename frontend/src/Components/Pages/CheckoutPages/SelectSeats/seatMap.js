
const createRow = (seatCount) =>
    Array.from({ length: seatCount }, (_, index) => {
        const seatNumber = index + 1;
        return {
            number: seatNumber,
            //type: wheelchairSeats.includes(seatNumber) ? "wheelchair" : "normal",
            reserved: false,
        };
    });

export const seatMap = [

    createRow(22),                      // rząd 1
    createRow(22),                      // rząd 2
    createRow(22),                      // rząd 3
    createRow(22),                      // rząd 4
    createRow(22),                      // rząd 5
    createRow(22, ),              // rząd 6 – np. dwa miejsca dla niepełnosprawnych
    createRow(22, ),              // rząd 7
    createRow(22),                      // rząd 8

    // Środkowa część sali – trochę mniej miejsc
    createRow(20),                      // rząd 9
    createRow(20),                      // rząd 10
    createRow(20),                      // rząd 11
    createRow(20),                      // rząd 12

    // Tył sali – jeszcze mniej miejsc
    createRow(18),                      // rząd 13
    createRow(18),                      // rząd 14
    createRow(18, ),             // rząd 15 – np. centralne miejsca dla niepełnosprawnych
    createRow(18),                      // rząd 16
];
