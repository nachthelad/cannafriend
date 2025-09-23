export const gpt5AssistantReply =
  "Para reducir el olor en un cultivo indoor, usá filtros de carbono en línea y asegurate de que el extractor renueve el aire constantemente.\n\nTambién controlá la humedad relativa entre 45% y 55% para evitar hongos y mantené las tomas de aire limpias para que circule mejor el flujo.";

export const gpt5NestedAssistantMessage = {
  id: "msg_abc123",
  type: "message",
  role: "assistant",
  content: [
    {
      id: "content_0",
      type: "output_text",
      text: [
        {
          id: "text_0",
          type: "text",
          text: {
            value:
              "Para reducir el olor en un cultivo indoor, usá filtros de carbono en línea y asegurate de que el extractor renueve el aire constantemente.",
            annotations: [],
          },
        },
        {
          id: "text_1",
          type: "text",
          text: {
            value:
              "\n\nTambién controlá la humedad relativa entre 45% y 55% para evitar hongos y mantené las tomas de aire limpias para que circule mejor el flujo.",
            annotations: [],
          },
        },
      ],
      output_text: [
        {
          id: "output_0",
          role: "assistant",
          content: [
            {
              id: "output_content_0",
              type: "text",
              text: {
                value:
                  "Para reducir el olor en un cultivo indoor, usá filtros de carbono en línea y asegurate de que el extractor renueve el aire constantemente.",
                annotations: [],
              },
            },
            {
              id: "output_content_1",
              type: "text",
              text: {
                value:
                  "\n\nTambién controlá la humedad relativa entre 45% y 55% para evitar hongos y mantené las tomas de aire limpias para que circule mejor el flujo.",
                annotations: [],
              },
            },
          ],
        },
      ],
      value: gpt5AssistantReply,
    },
  ],
  output_text: [
    {
      id: "root_output_0",
      role: "assistant",
      content: [
        {
          id: "root_output_text_0",
          type: "text",
          text: {
            value: gpt5AssistantReply,
            annotations: [],
          },
        },
      ],
    },
  ],
};
