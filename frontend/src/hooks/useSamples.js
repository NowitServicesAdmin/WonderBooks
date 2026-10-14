import { useEffect, useState } from "react";
import { getSamples } from "../services/bookService";
import { templates } from "../Data/Templatesdata";
import { toSampleCard } from "../utils/samples";

export const useSamples = () => {
  const [state, setState] = useState({ loading: true, samples: [] });

  useEffect(() => {
    let cancelled = false;

    getSamples()
      .then((samples) => {
        if (!cancelled) setState({ loading: false, samples });
      })
      .catch((error) => {
        console.error("Failed to load samples, using built-in ones:", error);
        if (!cancelled) setState({ loading: false, samples: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fromDatabase = state.samples.length > 0;

  return {
    items: fromDatabase ? state.samples.map(toSampleCard) : templates,
    loading: state.loading,
    fromDatabase,
  };
};

export default useSamples;
