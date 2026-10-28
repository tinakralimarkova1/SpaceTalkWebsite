import styles from "./year-navigation.module.css";

type YearNavigationProps = {
  label: string;
  years: { year: string; href: string }[];
};

export function YearNavigation({ label, years }: YearNavigationProps) {
  return (
    <nav className={styles.yearNav} aria-label={label}>
      {years.map(({ year, href }) => (
        <a href={href} key={year}>{year}</a>
      ))}
    </nav>
  );
}
