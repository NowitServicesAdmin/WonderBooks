import React, { useMemo, useState } from "react";
import {
  Bell,
  Search,
  Filter,
  ChevronRight,
  X,
  Package,
  Check,
  Printer,
  Truck,
  BookOpen,
  MapPin,
  Pencil,
  Download,
  Trash2,
  ShoppingBag,
} from "lucide-react";

import { myBooks } from "../../Data/Templatesdata"; // adjust path if needed

/* -------------------------------------------------------------------------- */
/*                                  ORDER DATA                                */
/* -------------------------------------------------------------------------- */

const orderMeta = [
  {
    bookId: 1,
    orderId: "WB-ORD-2025-0528-0012",
    status: "In Progress",
    date: "May 28, 2025",
    time: "10:30 AM",
    price: 699,
    statusStep: 1,
    shippingAddress: {
      name: "Arav Sharma",
      address: "123, Green Park Society",
      city: "Koramangala, Bangalore - 560034",
      state: "Karnataka, India",
      phone: "+91 98765 43210",
    },
  },
  {
    bookId: 2,
    orderId: "WB-ORD-2025-0518-0009",
    status: "Delivered",
    date: "May 18, 2025",
    time: "09:15 AM",
    price: 649,
    statusStep: 3,
  },

  // Additional visual order records using your existing book data.
  {
    bookId: 1,
    orderId: "WB-ORD-2025-0510-0007",
    status: "Delivered",
    date: "May 10, 2025",
    time: "08:45 AM",
    price: 599,
    statusStep: 3,
    title: "My Birthday Surprise",
  },
  {
    bookId: 2,
    orderId: "WB-ORD-2025-0428-0004",
    status: "Shipped",
    date: "Apr 28, 2025",
    time: "11:00 AM",
    price: 699,
    statusStep: 2,
    title: "Unicorn Dreams",
  },
  {
    bookId: 2,
    orderId: "WB-ORD-2025-0415-0002",
    status: "Cancelled",
    date: "Apr 15, 2025",
    time: "04:10 PM",
    price: 599,
    statusStep: -1,
    title: "Pirate Magic",
  },
];

const orders = orderMeta.map((order) => {
  const book = myBooks.find((item) => item.id === order.bookId);

  return {
    ...order,
    book: {
      ...book,
      title: order.title || book?.title,
    },
  };
});

const steps = [
  {
    key: "confirmed",
    label: "Confirmed",
    icon: Check,
  },
  {
    key: "printing",
    label: "Printing",
    icon: Printer,
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: BookOpen,
  },
];

/* -------------------------------------------------------------------------- */
/*                               STATUS HELPERS                               */
/* -------------------------------------------------------------------------- */

const statusStyles = {
  "In Progress":
    "border-[#f3d6b6] bg-[#fffaf3] text-[#c87520]",

  Delivered:
    "border-[#bfe3d7] bg-[#f2fbf7] text-[#317d65]",

  Shipped:
    "border-[#bcd8ef] bg-[#f4f9fd] text-[#3d77a6]",

  Cancelled:
    "border-[#f3caca] bg-[#fff7f7] text-[#c95a55]",
};

const getStatusClass = (status) =>
  statusStyles[status] || statusStyles["In Progress"];

/* -------------------------------------------------------------------------- */
/*                              PHYSICAL BOOK CARD                            */
/* -------------------------------------------------------------------------- */

const BookCover = ({
  book,
  size = "small",
  className = "",
}) => {
  const sizes = {
    small: {
      wrapper: "w-[102px] h-[142px]",
      spine: "w-[10px]",
    },
    large: {
      wrapper: "w-[170px] h-[205px]",
      spine: "w-[16px]",
    },
  };

  const config = sizes[size];

  return (
    <div
      className={`relative shrink-0 ${config.wrapper} ${className}`}
      style={{
        perspective: "800px",
      }}
    >
      {/* Shadow */}
      <div className="absolute -bottom-2 left-3 right-0 h-4 rounded-full bg-black/15 blur-md" />

      {/* Pages */}
      <div className="absolute bottom-1 right-[-6px] top-[3px] w-[9px] rounded-r-sm bg-[#eee7da] shadow-md" />

      {/* Spine */}
      <div
        className={`absolute bottom-0 left-0 top-0 ${config.spine} rounded-l-[4px]`}
        style={{
          background:
            book?.spineDark ||
            "linear-gradient(90deg,#312454,#18122e)",
        }}
      />

      {/* Cover */}
      <div
        className="absolute bottom-0 left-[8px] right-0 top-0 overflow-hidden rounded-r-[5px] border border-black/10 bg-slate-900 shadow-[8px_10px_15px_rgba(20,15,40,0.25)]"
        style={{
          transform: "rotateY(-3deg)",
          transformOrigin: "left center",
        }}
      >
        <img
          src={book?.cover}
          alt={book?.title}
          className="h-full w-full object-cover"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-[#120c22]/70" />

        {/* Book title */}
        <div className="absolute inset-x-2 top-3 text-center">
          <p
            className={`font-semibold leading-tight text-[#f7b94e] drop-shadow ${
              size === "large"
                ? "text-[16px]"
                : "text-[10px]"
            }`}
          >
            {book?.title}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                         REUSABLE COMPONENT 1                               */
/*                              ORDER LIST ITEM                               */
/* ========================================================================== */

export const OrderListItem = ({
  order,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full rounded-[15px] border text-left transition-all
        ${
          selected
            ? "border-[#8066d7] bg-white shadow-[0_8px_25px_rgba(91,67,177,0.12)]"
            : "border-[#ebe9f3] bg-white hover:border-[#cfc5ef] hover:shadow-md"
        }
      `}
    >
      <div className="flex min-h-[145px] items-center gap-5 px-6 py-4">
        {/* Book */}
        <BookCover book={order.book} size="small" />

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-bold text-[#252b50]">
            {order.book.title}
          </h3>

          <p className="mt-2 text-[13px] text-[#5c6488]">
            Order ID: {order.orderId}
          </p>

          <p className="mt-1 text-[13px] text-[#5c6488]">
            Ordered on {order.date}
            <span className="mx-2">•</span>
            {order.time}
          </p>

          {/* Progress */}
          <div className="mt-5">
            {order.status === "Cancelled" ? (
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    className="flex flex-1 items-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-[#c9c8d4] bg-white">
                        <span className="text-[9px] text-[#9c9bab]">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="mx-1 h-[1px] flex-1 bg-[#dddce6]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const completed =
                      index <= order.statusStep;

                    const active =
                      index === order.statusStep;

                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`
                              flex h-[19px] w-[19px]
                              items-center justify-center rounded-full
                              ${
                                completed
                                  ? "bg-[#5c45bd] text-white"
                                  : "border border-[#cbc9d8] bg-white text-[#a8a6b5]"
                              }
                            `}
                          >
                            {completed ? (
                              <Check size={11} strokeWidth={3} />
                            ) : (
                              <Icon size={10} />
                            )}
                          </div>
                        </div>

                        {index < steps.length - 1 && (
                          <div
                            className={`
                              mx-1 h-[1px] flex-1
                              ${
                                index < order.statusStep
                                  ? "bg-[#8d79df]"
                                  : "bg-[#dddce6]"
                              }
                            `}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="mt-2 flex justify-between px-[-2px]">
                  {steps.map((step) => (
                    <span
                      key={step.key}
                      className="w-1/4 text-center text-[10px] font-medium text-[#676a85]"
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex h-full flex-col items-end self-stretch py-1">
          <span
            className={`
              rounded-md border px-3 py-[6px]
              text-[11px] font-semibold
              ${getStatusClass(order.status)}
            `}
          >
            {order.status}
          </span>

          <div className="mt-4 flex items-center gap-5">
            <span className="text-[16px] font-bold text-[#342e79]">
              ₹{order.price}
            </span>

            <ChevronRight
              size={18}
              className="text-[#7365b6]"
            />
          </div>
        </div>
      </div>
    </button>
  );
};

/* ========================================================================== */
/*                         REUSABLE COMPONENT 2                               */
/*                              ORDER DETAILS                                 */
/* ========================================================================== */

export const OrderDetails = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  const isCancelled = order.status === "Cancelled";

  const currentStep = order.statusStep;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#ebe9f2] bg-white shadow-[0_6px_25px_rgba(65,50,120,0.05)]">

      {/* -------------------------------------------------------------- */}
      {/* Top */}
      {/* -------------------------------------------------------------- */}

      <div className="relative border-b border-[#efedf3] px-8 pb-6 pt-7">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-[#687092] transition hover:text-[#403780]"
        >
          <X size={22} />
        </button>

        <div className="flex gap-6">
          <BookCover
            book={order.book}
            size="large"
          />

          <div className="pt-2">
            <h2 className="text-[21px] font-bold text-[#24294e]">
              {order.book.title}
            </h2>

            <span
              className={`
                mt-3 inline-flex rounded-md border px-3 py-[6px]
                text-[11px] font-semibold
                ${getStatusClass(order.status)}
              `}
            >
              {order.status}
            </span>

            <p className="mt-3 text-[13px] text-[#626987]">
              Order ID: {order.orderId}
            </p>

            <p className="mt-2 text-[13px] text-[#626987]">
              Ordered on {order.date}
              <span className="mx-2">•</span>
              {order.time}
            </p>

            <p className="mt-4 text-[21px] font-bold text-[#332b79]">
              ₹{order.price}
            </p>
          </div>
        </div>

        {/* Progress timeline */}

        {!isCancelled && (
          <div className="mt-7">
            <div className="flex items-center">
              {steps.map((step, index) => {
                const Icon = step.icon;

                const completed =
                  index <= currentStep;

                const active =
                  index === currentStep;

                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          flex h-8 w-8 items-center justify-center
                          rounded-full border transition
                          ${
                            completed
                              ? "border-[#6849c8] bg-[#6747c6] text-white"
                              : "border-[#cfceda] bg-white text-[#aaa9b8]"
                          }
                          ${
                            active
                              ? "ring-4 ring-[#eee9ff]"
                              : ""
                          }
                        `}
                      >
                        {index < currentStep ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <Icon size={15} />
                        )}
                      </div>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`
                          h-[2px] flex-1
                          ${
                            index < currentStep
                              ? "bg-[#9d8be2]"
                              : "bg-[#dedde7]"
                          }
                        `}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className="text-center"
                >
                  <p
                    className={`
                      text-[11px] font-semibold
                      ${
                        index === currentStep
                          ? "text-[#563eb5]"
                          : "text-[#666b86]"
                      }
                    `}
                  >
                    {step.label}
                  </p>

                  <p className="mt-1 text-[10px] text-[#777b93]">
                    {index === 0
                      ? "May 28"
                      : index === 1 && currentStep >= 1
                      ? "May 29"
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Status message */}
      {/* -------------------------------------------------------------- */}

      {!isCancelled && (
        <div className="mx-8 mt-4 flex items-center gap-4 rounded-[10px] border border-[#d9d0f3] bg-[#f8f6ff] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eee9ff] text-[#634ac4]">
            <Printer size={17} />
          </div>

          <div>
            <p className="text-[12px] font-medium text-[#474d70]">
              {currentStep === 0 &&
                "Your order has been confirmed!"}

              {currentStep === 1 &&
                "Your book is being printed with care!"}

              {currentStep === 2 &&
                "Your book is on its way!"}

              {currentStep === 3 &&
                "Your book has been delivered!"}
            </p>

            <p className="mt-1 text-[11px] text-[#5d6482]">
              {currentStep === 1 &&
                "We'll ship it soon and notify you once it's on the way."}

              {currentStep === 2 &&
                "It will reach you soon. Please keep an eye on delivery updates."}

              {currentStep === 3 &&
                "We hope you enjoy reading your personalized Wonder Book!"}
            </p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Shipping + payment */}
      {/* -------------------------------------------------------------- */}

      <div className="mx-8 mt-4 grid grid-cols-[1fr_1fr] overflow-hidden rounded-[12px] border border-[#eceaf2]">

        {/* Shipping */}

        <div className="border-r border-[#eceaf2] px-5 py-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-bold text-[#2f3456]">
              Shipping Address
            </h4>

            <button className="flex items-center gap-1 text-[11px] font-semibold text-[#6147bf]">
              <Pencil size={13} />
              Edit
            </button>
          </div>

          <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-[#5f6682]">
            <p>
              {order.shippingAddress?.name || "Arav Sharma"}
            </p>

            <p>
              {order.shippingAddress?.address ||
                "123, Green Park Society"}
            </p>

            <p>
              {order.shippingAddress?.city ||
                "Koramangala, Bangalore - 560034"}
            </p>

            <p>
              {order.shippingAddress?.state ||
                "Karnataka, India"}
            </p>

            <p>
              {order.shippingAddress?.phone ||
                "+91 98765 43210"}
            </p>
          </div>
        </div>

        {/* Payment */}

        <div className="px-5 py-4">
          <h4 className="text-[12px] font-bold text-[#2f3456]">
            Payment Summary
          </h4>

          <div className="mt-4 space-y-3 text-[11px]">
            <div className="flex justify-between text-[#626984]">
              <span>Book Price</span>
              <span>₹{order.price}</span>
            </div>

            <div className="flex justify-between text-[#626984]">
              <span>Shipping</span>
              <span className="font-semibold text-[#41805f]">
                FREE
              </span>
            </div>

            <div className="border-t border-[#eceaf2] pt-3">
              <div className="flex justify-between font-bold text-[#393061]">
                <span>Total Paid</span>
                <span>₹{order.price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Book details */}
      {/* -------------------------------------------------------------- */}

      <div className="mx-8 mt-4 rounded-[12px] border border-[#eceaf2] p-5">
        <h4 className="text-[12px] font-bold text-[#2f3456]">
          Book Details
        </h4>

        <div className="mt-4 grid grid-cols-[1fr_300px] gap-6">
          {/* Details */}

          <div className="space-y-3">
            <DetailRow
              label="Story Title"
              value={order.book.title}
            />

            <DetailRow
              label="Pages"
              value="24 Pages"
            />

            <DetailRow
              label="Size"
              value='8 × 10 inches'
            />

            <DetailRow
              label="Cover"
              value="Hardcover"
            />

            <DetailRow
              label="Paper Quality"
              value="Premium Matte"
            />

            <DetailRow
              label="Language"
              value="English"
            />
          </div>

          {/* Book preview */}

          <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-[5px] bg-[#f4eee4] shadow-inner">
            <div className="absolute right-0 top-0 h-full w-[48%] bg-[#fffdf8]" />

            <div className="absolute right-4 top-7 w-[35%] text-[8px] leading-[1.8] text-[#575d72]">
              <p>
                Arav and his dog, Buddy looked up at the stars.
                “Wow! The universe is so big and beautiful!”
              </p>

              <p className="mt-3">
                They climbed into their rocket, ready for the greatest adventure ever.
              </p>
            </div>

            <div className="absolute left-7 top-[-2px]">
              <BookCover
                book={order.book}
                size="large"
                className="scale-[0.78] origin-top-left"
              />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Bottom actions */}
      {/* -------------------------------------------------------------- */}

      <div className="mt-auto flex items-center justify-between border-t border-[#efedf3] px-8 py-5">
        <button className="flex items-center gap-2 rounded-[9px] border border-[#bcb0eb] px-4 py-2.5 text-[12px] font-semibold text-[#5743b2] transition hover:bg-[#f7f5ff]">
          <Download size={16} />
          Download Invoice
        </button>

        {order.status === "In Progress" && (
          <button className="flex items-center gap-2 rounded-[9px] border border-[#f1bebe] px-4 py-2.5 text-[12px] font-semibold text-[#c95752] transition hover:bg-[#fff7f7]">
            <Trash2 size={16} />
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              DETAIL ROW                                    */
/* -------------------------------------------------------------------------- */

const DetailRow = ({
  label,
  value,
}) => (
  <div className="grid grid-cols-[100px_1fr] gap-4 text-[11px]">
    <span className="text-[#777c94]">
      {label}
    </span>

    <span className="font-medium text-[#4c536f]">
      {value}
    </span>
  </div>
);

/* ========================================================================== */
/*                              MAIN ORDERS PAGE                              */
/* ========================================================================== */

export const Orders = () => {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [selectedOrder, setSelectedOrder] = useState(
    orders[0]
  );
  const [search, setSearch] = useState("");

  const tabs = [
    {
      label: "All Orders",
      count: orders.length,
    },
    {
      label: "In Progress",
      count: orders.filter(
        (o) => o.status === "In Progress"
      ).length,
    },
    {
      label: "Shipped",
      count: orders.filter(
        (o) => o.status === "Shipped"
      ).length,
    },
    {
      label: "Delivered",
      count: orders.filter(
        (o) => o.status === "Delivered"
      ).length,
    },
    {
      label: "Cancelled",
      count: orders.filter(
        (o) => o.status === "Cancelled"
      ).length,
    },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "All Orders" ||
        order.status === activeTab;

      const matchesSearch =
        order.book.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        order.orderId
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="min-h-screen bg-[#faf9fd] p-4 lg:p-5">

      <main className="min-h-[calc(100vh-40px)] overflow-hidden rounded-[28px] border border-[#e6e3ee] bg-[#fcfbfe] shadow-[0_10px_40px_rgba(64,48,110,0.06)]">

        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}

        <header className="flex flex-col gap-5 border-b border-[#ebe9f0] px-7 py-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f1effb] to-[#e7e3f8] text-[#513cb0]">
              <ShoppingBag size={26} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-[26px] font-bold tracking-[-0.5px] text-[#25294c]">
                Orders
              </h1>

              <p className="mt-1 text-[13px] text-[#5e6687]">
                Track your physical book orders and their delivery status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-[#40357d]">
              <Bell size={22} strokeWidth={1.8} />

              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#df4547] px-1 text-[9px] font-bold text-white">
                3
              </span>
            </button>

            <div className="h-10 w-[1px] bg-[#e5e2eb]" />

            <div className="flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d4e5dc] bg-[#dff0e5] text-[16px] font-semibold text-[#39725d] shadow-sm">
                A
              </div>

              <div>
                <p className="text-[13px] font-bold text-[#3b4161]">
                  Arav
                </p>

                <p className="text-[10px] text-[#80849a]">
                  Parent
                </p>
              </div>

              <ChevronRight
                size={16}
                className="rotate-90 text-[#6b6d89]"
              />
            </div>
          </div>
        </header>

        {/* ============================================================ */}
        {/* CONTENT */}
        {/* ============================================================ */}

        <div className="grid min-h-[850px] grid-cols-1 lg:grid-cols-[50%_50%]">

          {/* ======================================================== */}
          {/* LEFT - ORDER LIST */}
          {/* ======================================================== */}

          <section className="border-r border-[#efedf3]">

            {/* Tabs + search */}

            <div className="flex flex-col gap-4 border-b border-[#eceaf1] px-7 pt-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex gap-7 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() =>
                      setActiveTab(tab.label)
                    }
                    className={`
                      relative flex shrink-0 items-center gap-2 pb-4
                      text-[12px] font-semibold transition
                      ${
                        activeTab === tab.label
                          ? "text-[#4333a2]"
                          : "text-[#565d7c]"
                      }
                    `}
                  >
                    {tab.label}

                    <span
                      className={`
                        flex h-[21px] min-w-[21px] items-center justify-center
                        rounded-full px-1 text-[10px]
                        ${
                          activeTab === tab.label
                            ? "bg-[#e8e1ff] text-[#563cc0]"
                            : "bg-[#f0eff4] text-[#83869a]"
                        }
                      `}
                    >
                      {tab.count}
                    </span>

                    {activeTab === tab.label && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#654bc7]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}

            <div className="flex gap-4 px-7 py-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#706e94]"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search your orders..."
                  className="h-[43px] w-full rounded-full border border-[#e1deea] bg-white pl-11 pr-4 text-[12px] text-[#3c4160] outline-none transition placeholder:text-[#9a9aad] focus:border-[#917ee0] focus:ring-2 focus:ring-[#eeeaff]"
                />
              </div>

              <button className="flex h-[43px] items-center gap-2 rounded-[10px] border border-[#dedbe7] bg-white px-5 text-[12px] font-semibold text-[#46399d] transition hover:bg-[#faf8ff]">
                <Filter size={16} />
                Filter
              </button>
            </div>

            {/* Orders */}

            <div className="space-y-3 px-7 pb-5">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <OrderListItem
                    key={order.orderId}
                    order={order}
                    selected={
                      selectedOrder?.orderId ===
                      order.orderId
                    }
                    onClick={() =>
                      setSelectedOrder(order)
                    }
                  />
                ))
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <Package
                    size={40}
                    className="text-[#b4afc8]"
                  />

                  <h3 className="mt-4 text-[16px] font-bold text-[#3d4262]">
                    No orders found
                  </h3>

                  <p className="mt-2 text-[12px] text-[#7b8098]">
                    Try changing your search or filter.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}

            <div className="flex items-center justify-between border-t border-[#eeecf2] px-7 py-5">
              <p className="text-[12px] text-[#666d89]">
                Showing 1-{filteredOrders.length} of{" "}
                {orders.length} orders
              </p>

              <div className="flex items-center gap-2">
                <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#817b9b] hover:bg-[#f1eef8]">
                  <ChevronRight
                    size={17}
                    className="rotate-180"
                  />
                </button>

                <button className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[#f0ecfa] text-[12px] font-semibold text-[#5943b2]">
                  1
                </button>

                <button className="flex h-[38px] w-[30px] items-center justify-center text-[12px] font-semibold text-[#4d4675]">
                  2
                </button>

                <button className="flex h-[38px] w-[30px] items-center justify-center text-[12px] font-semibold text-[#4d4675]">
                  3
                </button>

                <button className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#5843ae] hover:bg-[#f1eef8]">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* RIGHT - ORDER DETAILS */}
          {/* ======================================================== */}

          <section className="min-h-full bg-[#fcfbfe] p-3">
            {selectedOrder ? (
              <OrderDetails
                order={selectedOrder}
                onClose={() =>
                  setSelectedOrder(null)
                }
              />
            ) : (
              <div className="flex h-full min-h-[600px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0edfa] text-[#6752bf]">
                  <Package size={28} />
                </div>

                <h3 className="mt-5 text-[17px] font-bold text-[#353a5b]">
                  Select an order
                </h3>

                <p className="mt-2 max-w-[240px] text-[12px] leading-relaxed text-[#7a7f97]">
                  Choose an order from the list to view its complete details and delivery progress.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}