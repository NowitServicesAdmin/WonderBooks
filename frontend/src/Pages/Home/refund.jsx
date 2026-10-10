import { PolicyLayout } from "../../Components/Policy-Layout";

const li = {
  marginBottom: 10,
  fontSize: "0.75rem",
  color: "#374151",
  lineHeight: 1.7,
};

const ol = {
  paddingLeft: 0,
  margin: 0,
  listStylePosition: "inside",
};

const Refund = () => (
  <PolicyLayout title="WONDERBOOKS - Refund Policy">

    <p
      style={{
        fontSize: "0.8rem",
        marginBottom: 8,
        color: "#374151",
        lineHeight: 1.7,
      }}
    >
      NOWIT SERVICES provides services through <strong>Wonderbooks</strong>.
      This policy clearly states our refund and cancellation terms.
    </p>

    <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 4 }}>
      <strong>App Name:</strong> Wonderbooks
    </p>

    <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 4 }}>
      <strong>Developer:</strong> NOWIT SERVICES Pvt Ltd
    </p>

    <p style={{ fontSize: "0.75rem", color: "#111827", marginBottom: 8 }}>
      <strong>Document:</strong> Refund Policy
    </p>

    <hr
      style={{
        border: "none",
        borderTop: "1px solid #000",
        marginBottom: 12,
      }}
    />

    <ol style={ol}>
      <li style={li}>
        <strong>Refund Policy — </strong>
        All payments made for services, subscriptions, physical books,
        personalized books, or digital products through Wonderbooks are final
        and non-refundable, except where required by applicable law.
      </li>

      <li style={li}>
        Once a digital service, personalized book generation, subscription,
        or other paid service has been purchased, initiated, activated, or
        accessed, no refund will generally be provided.
      </li>

      <li style={li}>
        Cancellation of a subscription does not entitle the user to a refund
        for the remaining subscription period. The subscription will remain
        active until the end of the applicable billing period.
      </li>

      <li style={li}>
        For physical personalized books, cancellation or refund requests may
        not be accepted once the book has entered the printing or production
        process.
      </li>

      <li style={li}>
        No return, exchange, or replacement is applicable to digital products
        or personalized content. For physical books, any issue involving
        damage, incorrect printing, or a manufacturing defect may be reviewed
        by our support team on a case-by-case basis.
      </li>

      <li style={li}>
        By purchasing or using Wonderbooks services, you acknowledge and agree
        to these refund and cancellation terms.
      </li>

      <li style={li}>
        This policy applies to all users unless otherwise required by
        applicable law or explicitly stated in a separate written agreement
        approved by NOWIT SERVICES Pvt Ltd.
      </li>

      <li style={li}>
        For any refund, cancellation, or order-related questions, you may
        contact us:
        <br />
        Phone: +91 7893536373
        <br />
        Email: sales@nowitservices.com
        <br />
        Working Hours: Monday – Saturday (10:00 AM – 6:00 PM)
      </li>
    </ol>
  </PolicyLayout>
);

export default Refund;