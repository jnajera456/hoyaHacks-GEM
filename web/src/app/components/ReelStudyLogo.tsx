import Image from 'next/image';
import styles from '../stylesheets/ReelStudyLogo.module.css';

type ReelStudyLogoProps = {
  className?: string;
  priority?: boolean;
};

const ReelStudyLogo = ({
  className,
  priority = false,
}: ReelStudyLogoProps) => {
  const classes = [styles.logo, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      <Image
        className={styles.mark}
        src="/brand/open-reel-mark.svg"
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        priority={priority}
      />
      <span className={styles.wordmark}>
        Reel<span className={styles.accent}>Study</span>
      </span>
    </span>
  );
};

export default ReelStudyLogo;
