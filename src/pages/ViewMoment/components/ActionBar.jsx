import Button from "../../../ui/Button/Button";

import {
  Share2,
  Download,
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  Link,
} from "lucide-react";

import { motion } from "framer-motion";

import styles from "./ActionBar.module.css";

function ActionBar({
  moment,
  deleting,
  onBack,
  onEdit,
  onDelete,
}) {
  //---------------------------------------
  // Share
  //---------------------------------------

  async function handleShare() {
    if (!navigator.share) {
      alert(
        "Sharing isn't supported on this browser."
      );
      return;
    }

    try {
      await navigator.share({
        title: moment.title,
        text: moment.description,
        url: window.location.href,
      });
    } catch (error) {
      console.error(error);
    }
  }

  //---------------------------------------

  function handleDownload() {
    if (!moment.image_url) return;

    const link =
      document.createElement("a");

    link.href = moment.image_url;
    link.download =
      moment.title || "memory";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  //---------------------------------------

  function handlePrint() {
    window.print();
  }

  //---------------------------------------

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      alert("Link copied!");
    } catch (error) {
      console.error(error);
    }
  }

  //---------------------------------------

  const actions = [
    {
      icon: ArrowLeft,
      label: "Back",
      action: onBack,
      variant: "secondary",
    },
    {
      icon: Share2,
      label: "Share",
      action: handleShare,
    },
    moment.image_url && {
      icon: Download,
      label: "Download",
      action: handleDownload,
    },
    {
      icon: Printer,
      label: "Print",
      action: handlePrint,
    },
    {
      icon: Link,
      label: "Copy Link",
      action: handleCopyLink,
    },
    {
      icon: Pencil,
      label: "Edit",
      action: onEdit,
    },
    {
      icon: Trash2,
      label: deleting
        ? "Deleting..."
        : "Delete",
      action: onDelete,
      danger: true,
      disabled: deleting,
    },
  ].filter(Boolean);

  return (
    <motion.section
      className={styles.section}
      initial={{
        opacity: 0,
        y: 25,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
    >
      <div className={styles.header}>
        <span className={styles.badge}>
          ⚡ Quick Actions
        </span>

        <h2>Manage this Memory</h2>

        <p>
          Edit, share, print,
          download or delete this
          memory.
        </p>
      </div>

      <div className={styles.grid}>
        {actions.map(
          (
            {
              icon: Icon,
              label,
              action,
              danger,
              variant,
              disabled,
            },
            index
          ) => (
            <motion.div
              key={label}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index * 0.06,
              }}
              viewport={{
                once: true,
              }}
            >
              <Button
                variant={
                  danger
                    ? "danger"
                    : variant ||
                      "primary"
                }
                fullWidth
                disabled={disabled}
                leftIcon={
                  <Icon size={18} />
                }
                onClick={action}
              >
                {label}
              </Button>
            </motion.div>
          )
        )}
      </div>
    </motion.section>
  );
}

export default ActionBar;