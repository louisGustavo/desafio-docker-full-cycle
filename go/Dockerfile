FROM golang:1.20.1-alpine3.17 AS builder

WORKDIR /fullcycle

COPY . /fullcycle/

RUN go build -ldflags '-s -w' fullcycle.go

FROM scratch

WORKDIR /fullcycle

COPY --from=builder /fullcycle .

CMD [ "./fullcycle" ]