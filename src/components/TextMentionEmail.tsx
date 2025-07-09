import { Doc } from "@prisma/client";
import { ReactNode } from "react";

interface TextMentionEmailProps {
  authorName: string;
  content: ReactNode;
  docs: Partial<Doc> | null;
}

const TextMentionEmail = ({
  authorName,
  docs,
  content,
}: TextMentionEmailProps) => {
  const { label, id, projectId } = docs || {};

  const mentionUrl = `https://www.devcollab.store/projects/${projectId}/docs?docId=${id}`;

  return (
    <html>
      <body
        style={{
          fontFamily: "Arial, sans-serif",
          lineHeight: "1.6",
          color: "#333",
          margin: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "20px auto",
            padding: "20px",
            border: "1px solid #e0e0e0",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              backgroundColor: "#2c3e50",
              color: "white",
              padding: "10px",
              textAlign: "center",
              borderRadius: "5px 5px 0 0",
            }}
          >
            <h2 style={{ margin: 0 }}>You Were Mentioned</h2>
          </div>

          <div style={{ padding: "20px" }}>
            <p>
              <strong>{authorName ?? "Someone"}</strong> mentioned you in the
              document <em>{label}</em>.
            </p>

            <blockquote
              style={{
                margin: "16px 0",
                padding: "12px 16px",
                backgroundColor: "#ffffff",
                borderLeft: "4px solid #2980b9",
                fontStyle: "italic",
                color: "#444",
              }}
            >
              {content}
            </blockquote>

            <p>
              You can view the full context by clicking the link below:
              <br />
              <a
                href={mentionUrl}
                style={{
                  color: "#2980b9",
                  fontWeight: "bold",
                  textDecoration: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  marginTop: "10px",
                }}
                target="_blank"
              >
                View the Mention →
              </a>
            </p>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#7f8c8d",
              textAlign: "center",
              paddingTop: "10px",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <p>This is an automated message from Dev-Collab. Do not reply.</p>
            <p>© 2025 Dev-Collab. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default TextMentionEmail;
