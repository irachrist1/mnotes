## Bug Fixes & Feature Planning for MNotes-Omega

### 🐛 CRITICAL BUGS TO FIX

**1. Dashboard Not Updating from Chat**
- When user provides info via chat onboarding (MRR, income streams, etc.), the dashboard fields don't populate immediately.
- There's a slight flicker when the user signs in where it first shows the dashboard and then redirects to the onboarding page just like milliseconds later.
- The AI acknowledges the data but fails to write it to the database/state when the user updates that data via ideas page. it shows an error on top as a banner that says "failed to save"
- Check the connection between chat responses and dashboard state management and make sure the data is being written to the database and state correctly.


**5. Model choice and adding API key during onboarding doesn't work at all**
- The model choice and adding API key during onboarding doesn't work at all.
- The user is not able to select a model and add an API key during onboarding it shows it for half a second and then redirects to the dashboard.
- When the user sees the dashboard the chat floating icon auto loads but the chat doesn't work when you chat with it. Also since the dashboards is empty it's confusing to the user. I suggest we have a full chat tab front and center of the dashboard with the ability to close and the recommended prompt should be based on the user's soul file with clear inputs that when you click on them they auto populate the dashboard for you or those inputs could be like questions you confirm yes or no too and it just auto populate the dashboards. the idea is the user shouldn't feel like there are doing a lot of work getting the data in and the value of the assistant should be extrimely clear to the user.

---

### FEATURE RECOMMENDATIONS TO THINK ABOUT AND HOPEFULLY IMPLEMENT

**Priority 1: Actionable Recommended Actions**
```
User feedback: "I want to click on a recommended action and have it DO something"

Examples:
- Add "Push to Calendar" button on each recommended action (this ofcause requires the AI to first understand the task and then propose a date and time for it and connect to your calendar to see if you don't have other events and ask you questions and propose a date and time that works for you etc...) the idea is to have it be reactive and proactive and not just a button you click on and it does something that might not be what you want or need.



**Priority 3: Research Integration for Recommendations**
```
User feedback: "If It generated an insight and it suggesting i draft a pricing model, it's action item should be to have a button where you click and it goes to research examples for me and then it presents the findings to you and you can click on a button to draft the pricing model based on the findings."

Requirements:
- When user commits to an action, trigger research agent
- Search for relevant examples, use cases, best practices, templates, etc...
- Present findings as supporting context under the recommendation and you can click on a button to draft the pricing model based on the findings.
- Use web search tool or Perplexity API or any other research tool that you have access to.
- we need to rethink of the UI to manage the interface between the AI and the user and the research tool and the findings and the drafting of the pricing model and the button to draft the pricing model based on the findings and all of these things should be seamless and intuitive and easy to use and not feel like you are doing a lot of work to get the job done.
```

**Priority 4: Reactive AI Notifications**
```
User feedback: "I want Jarvis to proactively message me, not just respond"

Requirements:
- Implement scheduled check-ins based on user goals
- Send notifications for upcoming calendar items
- Proactive insights based on patterns detected
- "I noticed you..." style messages on dashboard
```

**Priority 5: Add Feedback Form**
```
- Add user feedback collection mechanism
- Track how users are actually using the app vs intended use
- Note: Users are using it as money management tracker and Trello-style project board
```

---

### 🔍 DEBUGGING CHECKLIST

1. Check Convex functions for state mutation errors
2. Verify API key handling for Google AI Studio integration
3. Test the prompt→model routing logic with edge cases
4. Add logging to track which model responds to which query
5. Review the SOL file update triggers

---

### 📁 FILES LIKELY AFFECTED
- Chat component (message handling → dashboard sync)
- Dashboard state management
- AI routing/election engine
- Insight generation service
- User profile/SOL file handler

---
