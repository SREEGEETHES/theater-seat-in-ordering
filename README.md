# N4X

> **Every order. Directly accounted for.**

N4X is building a new ordering and payment infrastructure for restaurants and cinemas in India.

The idea started with a simple question:

**Why should a restaurant or cinema pay a percentage of every digital food order to a payment gateway when the customer is already paying through UPI?**

We are building the ordering layer around **UPI and banking infrastructure**, instead of building another ordering system that depends on traditional per-transaction payment gateways.

---

## The Problem

Digital ordering is becoming standard across restaurants and cinemas.

A typical flow looks like:

```text
Customer
   ↓
QR Code
   ↓
Ordering Platform
   ↓
Payment Gateway
   ↓
UPI / Bank
   ↓
Merchant
```

The problem is the additional cost introduced between the customer and the merchant.

For a high-volume restaurant or cinema, even a small percentage charged on every transaction can become a significant annual expense.

For example:

```text
₹10,00,000 digital orders / month
× 2.5% processing cost
────────────────────────
₹25,000 / month

₹3,00,000 / year
```

At larger volumes, this becomes a major operating cost.

India already has an enormous UPI ecosystem.

So we asked:

> **Can we build the ordering experience around UPI instead of routing every order through an expensive payment gateway?**

That's the problem N4X is exploring.

---

## What We're Building

N4X is building **UPI-first ordering infrastructure** for:

### 🍽️ Restaurants

Customers scan a QR code at their table:

```text
Scan QR
   ↓
Browse Menu
   ↓
Customize Order
   ↓
Pay with UPI
   ↓
Kitchen Receives Order
   ↓
Food Delivered
```

### 🎬 Cinemas

Customers can order directly from their cinema seat:

```text
Seat F12
   ↓
Scan QR
   ↓
Browse Food & Beverages
   ↓
Order
   ↓
Pay through UPI
   ↓
Concession / Kitchen Receives Order
   ↓
Order Delivered to Seat
```

No standing in line.

No separate ordering terminal.

No unnecessary payment-processing layer.

---

## The Core Insight

We are **not trying to build another QR menu**.

The QR code is only the interface.

The real product is the infrastructure underneath it.

Our thesis is:

> **UPI should be the payment rail. The ordering platform should orchestrate the transaction, not unnecessarily add another percentage-based payment layer between the merchant and the bank.**

We are exploring direct integration with banking/UPI infrastructure to make this architecture possible.

---

## Current Status

The MVP is ready.

### Currently working on:

* QR-based restaurant ordering
* Cinema seat-based ordering
* Digital menu
* Cart and checkout
* UPI-first payment flow
* Order management
* Restaurant/cinema-side order handling
* Payment integration architecture
* Merchant workflow
* Business validation

We have also started discussions with **SBI** regarding the requirements for enabling **UPI Intent/access** for the product.

The integration and commercial model are currently being evaluated.

---

## Why India?

India has already solved one of the hardest parts of digital commerce:

**instant account-to-account payments through UPI.**

The opportunity we see is building better business workflows directly around that infrastructure.

Restaurants and cinemas don't just need a payment button.

They need:

* Ordering
* Payment
* Order routing
* Kitchen/concession management
* Table/seat mapping
* Reconciliation
* Analytics
* Customer experience

N4X brings these pieces together while making the payment architecture **UPI-first**.

---

## Who We Are Building For

### Restaurants

Especially businesses with significant digital ordering volume where payment-processing costs accumulate quickly.

### Cinemas

Where customers frequently purchase food and beverages while already seated inside the theatre.

The cinema use case is particularly interesting because the customer's **seat itself becomes the delivery destination**.

---

## Example Economics

Consider a business processing:

```text
₹1 Crore
annual digital food orders
```

At a hypothetical 2.5% processing cost:

```text
₹1,00,00,000
× 2.5%
────────────
₹2,50,000 / year
```

The exact savings depend on the final banking/UPI arrangement and commercial terms.

Our goal is to remove unnecessary percentage-based payment costs wherever the underlying UPI/banking infrastructure allows it.

---

## Product Architecture

The long-term architecture looks roughly like:

```text
                    ┌─────────────────┐
                    │    Customer     │
                    └────────┬────────┘
                             │
                          Scan QR
                             │
                             ▼
                    ┌─────────────────┐
                    │  N4X Ordering   │
                    │    Platform     │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
          Restaurant/Cinema          UPI Payment
             Order System                │
                 │                       ▼
                 ▼                 Bank / UPI
          Kitchen / Counter             │
                 │                       │
                 └───────────┬───────────┘
                             ▼
                         Merchant
```

The objective is to make the payment layer as close to the existing UPI/banking infrastructure as commercially and technically possible.

---

## Roadmap

### Phase 1 — MVP

* [x] QR ordering
* [x] Restaurant ordering flow
* [x] Cinema ordering concept
* [x] Menu management
* [x] Cart and checkout
* [x] Initial order management

### Phase 2 — Payment Infrastructure

* [x] UPI-first architecture
* [ ] Bank integration
* [ ] UPI Intent/access
* [ ] Payment confirmation
* [ ] Settlement & reconciliation
* [ ] Merchant onboarding

### Phase 3 — Business Pilots

* [ ] Restaurant pilot
* [ ] Cinema pilot
* [ ] Measure order conversion
* [ ] Measure operational efficiency
* [ ] Measure payment-cost savings
* [ ] Iterate from merchant feedback

### Phase 4 — Scale

* [ ] Multi-location restaurants
* [ ] Cinema chains
* [ ] Merchant analytics
* [ ] Inventory integration
* [ ] POS integrations
* [ ] Automated reconciliation
* [ ] Multi-tenant infrastructure

---

## What Makes N4X Different?

There are already QR menus.

There are already restaurant ordering platforms.

There are already payment gateways.

We're approaching the problem from a different angle:

> **What happens if we design the ordering system around the payment infrastructure India already has?**

Instead of:

```text
Ordering Platform
        ↓
Payment Gateway
        ↓
UPI
        ↓
Bank
```

we are exploring:

```text
Ordering Platform
        ↓
UPI / Banking Infrastructure
        ↓
Merchant
```

The goal is to reduce unnecessary layers and therefore reduce unnecessary costs.

---

## The N4 Story

N4X is more than a name.

**N4 comes from a personal experience that shaped how we think about systems, accountability, and transparency.**

The principle behind N4X is simple:

> **A transaction should speak for itself.**

Make every order visible.

Make every payment traceable.

Make every transaction accountable.

That's the standard we're trying to build into N4X.

---

## Status

🚧 **Early-stage startup — MVP ready**

We are currently validating the product, business model, and UPI/banking integration with potential partners and businesses.

---

## Founder

**Sree Geethesh Dhananjayan**

Computer Science Engineer building products across AI, cloud infrastructure, automation, and developer tooling.

---

## Vision

We don't want to build another QR menu.

We want to build the **payment and ordering infrastructure underneath the next generation of restaurants and cinemas.**

**N4X — Every order. Directly accounted for.**
