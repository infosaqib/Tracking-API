export const constructSowPrompt = (
  serviceName: string,
  serviceDescription: string,
): string => {
  return `Generate a comprehensive scope of work document in markdown format for the following service:

        Service Name: ${serviceName}

        Please create a professional scope of work document that includes:

        ### Scope and Descriptions of Services
                - **Project Overview**
                - **Scope of Services**
                - **Site Conditions & Access**
                - **Materials, Equipment, & Permits**

                ### Service Frequency & Scheduling
                - **Service Frequency**
                - **Work Hours**
                - **Seasonal Adjustments**
                - **Emergency Response**
                - **Client Availability & Access**
                - **Holiday & Blackout Dates**
                - **Rescheduling Process**

                ### Service Standards
                - **Workmanship & Materials**
                - **Compliance & Regulations**
                - **Appearance & Conduct**
                - **Customer Service**
                - **Closeout & Documentation**

        Format the response as clean markdown with proper headings, bullet points, and structure. Make it professional and comprehensive.
        **Important: Stick to the given headings and subheadings. Do not add any new headings or subheadings.**

        Requirements:
        - Use proper markdown formatting
        - Include relevant details for ${serviceName}
        - Include relevant details for ${serviceDescription} only if it is valid.
        - Dont use service description as such. Only use it for generating data.
        - Only use service description if it is valid.
        - If service description is invalid, dont use it.
        - Make it specific and actionable
        - Include standard industry practices

        INSTRUCTIONS:
                - Add document title as "${serviceName} Scope of Work"
                - For each subheading, consolidate all relevant details from the input, even if the wording is different.
                - If multiple points are found for a subheading, use sub-bullets.
                - When consolidating lists (numbered, lettered, or bulleted), use markdown nested lists to represent hierarchy (e.g., 1., a., b., etc.). Do NOT merge multiple points into a single paragraph—each point and sub-point should be a separate bullet or list item. If the document uses numbers/letters, use those. If it uses bullets, use bullets.
                - If and only if a section contains zero valid points, write “• Not specified”.
                - Use the exact subheading names as above in the output.
                - Dont add any additional headings other than specified headings.
                - Dont add placeholders for any sentence.
                - Make comments friendly and conversational tone.
                - Do not mention formatting details (such as "in markdown format") or any instructions in the comments.
                - Comments should focus only on the content, not on how it is formatted or generated.
                - Max limit for comment and bottom comment is 100 characters.
                - Eg: "Here is the scope of work for the ${serviceName} service as requested."

                FORMATTING REQUIREMENTS:
                - Use bullet points (-) for all information
                - Keep exact wording from original document, except for sentences with amounts/rates, which must be rephrased as above.
                - Use tables for structured data (schedules, specifications, etc.), but do NOT include any amounts or rates in the tables—replace with a general phrase like “standard charge applies” or “see contract for details” if needed.
                - If multiple services exist, clearly separate them with headers
                - If no information exists for a category, write "• Not specified"
                - Maintain technical terms and measurements exactly as stated, except for amounts/rates which must be omitted or generalized.

        IMPORTANT: Respond ONLY with a JSON object in this exact format:
        {
          "comments": "Any comments or explanations.",
          "bottomComment": "Friendly closing remark that invites the user to continue, like ChatGPT would do.",
          "markdown": "The complete SOW markdown content here"
        }
        
        Do not include any other text, explanations, or markdown code blocks in your response.
        `;
};

export const constructSowAgentPrompt = (
  serviceName: string,
  serviceDescription: string,
): string => {
  return `Generate a comprehensive scope of work document in markdown format for the following service:

        Service Name: ${serviceName}

        Please create a professional scope of work document that includes:

        ### Scope and Descriptions of Services
                - **Project Overview**
                - **Scope of Services**
                - **Site Conditions & Access**
                - **Materials, Equipment, & Permits**

                ### Service Frequency & Scheduling
                - **Service Frequency**
                - **Work Hours**
                - **Seasonal Adjustments**
                - **Emergency Response**
                - **Client Availability & Access**
                - **Holiday & Blackout Dates**
                - **Rescheduling Process**

                ### Service Standards
                - **Workmanship & Materials**
                - **Compliance & Regulations**
                - **Appearance & Conduct**
                - **Customer Service**
                - **Closeout & Documentation**

        Format the response as clean markdown with proper headings, bullet points, and structure. Make it professional and comprehensive.
        **Important: Stick to the given headings and subheadings. Do not add any new headings or subheadings.**

        Requirements:
        - Use proper markdown formatting
        - Include relevant details for ${serviceName}
        - Include relevant details for ${serviceDescription} only if it is valid.
        - Dont use service description as such. Only use it for generating data.
        - Only use service description if it is valid.
        - If service description is invalid, dont use it.
        - Make it specific and actionable
        - Include standard industry practices

        INSTRUCTIONS:
                - Add document title as "${serviceName} Scope of Work"
                - For each subheading, consolidate all relevant details from the input, even if the wording is different.
                - If multiple points are found for a subheading, use sub-bullets.
                - When consolidating lists (numbered, lettered, or bulleted), use markdown nested lists to represent hierarchy (e.g., 1., a., b., etc.). Do NOT merge multiple points into a single paragraph—each point and sub-point should be a separate bullet or list item. If the document uses numbers/letters, use those. If it uses bullets, use bullets.
                - If and only if a section contains zero valid points, write “• Not specified”.
                - Use the exact subheading names as above in the output.
                - Dont add any additional headings other than specified headings.
                - Dont add placeholders for any sentence.

                FORMATTING REQUIREMENTS:
                - Use bullet points (-) for all information
                - Keep exact wording from original document, except for sentences with amounts/rates, which must be rephrased as above.
                - Use tables for structured data (schedules, specifications, etc.), but do NOT include any amounts or rates in the tables—replace with a general phrase like “standard charge applies” or “see contract for details” if needed.
                - If multiple services exist, clearly separate them with headers
                - If no information exists for a category, write "• Not specified"
                - Maintain technical terms and measurements exactly as stated, except for amounts/rates which must be omitted or generalized.

        `;
};
