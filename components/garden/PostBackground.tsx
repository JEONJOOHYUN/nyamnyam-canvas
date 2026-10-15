function PostOfficeGround() {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse
        cx="275"
        cy="459"
        rx="230"
        ry="31"
        fill="#258e3d"
        opacity=".18"
      />
      <ellipse cx="279" cy="433" rx="157" ry="45" fill="#a5e56a" />
      <ellipse cx="279" cy="433" rx="133" ry="29" fill="#f6d78a" />
    </g>
  );
}

export function PostBackground({ tall }: { tall: boolean }) {
  return (
    <>
      <path
        d={
          tall
            ? "M0 365Q230 305 500 350T1000 340V700H0Z"
            : "M0 465Q170 373 367 458T711 447T1000 398V700H0Z"
        }
        fill="#9ce66a"
      />
      <path d="M0 529Q235 460 444 510T1000 479V700H0Z" fill="#7bd64f" />
      <path d="M0 620Q245 503 524 590T1000 563V700H0Z" fill="#60ca43" />
      <path d="M0 694Q260 583 497 636T1000 626V700H0Z" fill="#4dbd40" />
    </>
  );
}

export function PostScenery({ tall }: { tall: boolean }) {
  return (
    <>
      <g
        transform={tall ? "translate(421 85) scale(.85)" : "translate(160 130)"}
        fill="#ffce25"
        stroke="#ffce25"
        strokeWidth="8"
        strokeLinecap="round"
      >
        <path d="M0-66v-13M47-47l10-10M66 0h13M47 47l10 10M0 66v13M-47 47l-10 10M-66 0h-13M-47-47l-10-10" />
        <circle r="48" stroke="none" />
      </g>
      <g fill="white">
        <path
          transform={
            tall ? "translate(60 285) scale(1.15)" : "translate(292 120)"
          }
          d="M0 25Q-8 2 18 0Q22-35 51-23Q75-38 89-10Q122-13 124 13Q142 36 114 39H18Q0 39 0 25Z"
        />
        <path
          transform={
            tall
              ? "translate(122 107) scale(.9)"
              : "translate(850 110) scale(.7)"
          }
          d="M0 25Q-8 2 18 0Q22-35 51-23Q75-38 89-10Q122-13 124 13Q142 36 114 39H18Q0 39 0 25Z"
        />
      </g>
      <g
        transform={tall ? "translate(14 196) scale(.86)" : "translate(415 94)"}
      >
        <PostOfficeGround />
      </g>
    </>
  );
}
