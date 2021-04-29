export const GraphDataConfig = {
  borderColor: "#000000",
  fill: false,
};

// graph data config with gradient background
export const GraphDataConfigGradient = {
  ...GraphDataConfig,
  backgroundColor(context: any) {
    const gradient = context.chart.ctx.createLinearGradient(
      0,
      0,
      0,
      context.chart.height
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, .3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    return gradient;
  },
  fill: true,
};

export function GraphOptions({
  ticks = false,
  tooltipText,
  tickText,
}: IGraphOptions) {
  const fontFamily = '"Poppins", sans-serif',
    fontStyle = {
      fontFamily,
      fontSize: 12,
    };

  return {
    responsive: true,
    maintainAspectRatio: true,
    elements: {
      point: { radius: 0 },
      line: {
        borderWidth: 5,
        borderCapStyle: "round",
      },
    },
    layout: {
      padding: {
        top: 12,
      },
    },
    tooltips: {
      mode: "index",
      intersect: false,
      titleFontFamily: fontFamily,
      bodyFontColor: "#d4d4d4",
      bodyFontFamily: fontFamily,
      padding: 9,
      callbacks: {
        label: tooltipText ?? (({ value }: any) => value),
      },
    },
    hover: { mode: "nearest", intersect: true },
    legend: { display: false },
    scales: {
      xAxes: [
        {
          ticks: {
            display: ticks,
            ...fontStyle,
          },
          gridLines: { display: false },
        },
      ],
      yAxes: [
        {
          ticks: {
            display: ticks,
            ...fontStyle,
            callback: tickText ?? ((val) => val),
          },
          scaleLabel: { display: false },
          gridLines: { display: false },
        },
      ],
    },
  };
}

interface IGraphOptions {
  ticks?: boolean;
  tooltipText?: (tooltipItem?: any) => string;
  tickText?: (value: string, index: number) => string;
}
