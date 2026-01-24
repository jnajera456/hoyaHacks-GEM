// Convert study materials to speech script
export function createAudioScript(materials) {
  let script = "Here are your study materials. ";
  
  materials.forEach((material, index) => {
    if (material.type === "flashcard") {
      script += `Flashcard ${index + 1}: ${material.content}. `;
      if (material.explanation) {
        script += `Explanation: ${material.explanation}. `;
      }
    } else if (material.type === "summary") {
      script += `Summary: ${material.content}. `;
    } else if (material.type === "concept") {
      script += `Key Concept: ${material.content}. `;
      if (material.explanation) {
        script += `${material.explanation}. `;
      }
    }
  });
  
  return script;
}