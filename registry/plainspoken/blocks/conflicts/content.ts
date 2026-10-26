// The invented people, ticket and document the edit-conflict prototypes play with, and the
// edits the simulated collaborators make.
import type { Collaborator } from "@/registry/plainspoken/ui/presence";

/** You, in every prototype */
export const AMARA: Collaborator = { id: "amara", name: "Amara Osei", color: 1 };
/** The colleague editing the same thing */
export const JONAS: Collaborator = { id: "jonas", name: "Jonas Weber", color: 2 };
/** Someone who only has the document open */
export const PRIYA: Collaborator = { id: "priya", name: "Priya Nair", color: 4 };

/** A find-and-replace the script types out, character by character */
export interface ScriptedEdit {
  find: string;
  replace: string;
  /** Words for the log: "changed “Friday” to “Thursday”" */
  says: string;
}

/** The text and scripted edits one prototype plays with */
export interface Material {
  /** What the field or document is, for labels and announcements: "the description" */
  name: string;
  text: string;
  /** Your edit, used when a scenario needs you to have changed something */
  mine: ScriptedEdit;
  /** Jonas's edit of the same words as yours */
  theirsSame: ScriptedEdit;
  /** Jonas's edit somewhere else */
  theirsOther: ScriptedEdit;
  /** More of Jonas's edits elsewhere, for the offline scenario */
  theirsMore?: ScriptedEdit[];
  /** More of your edits, for the offline scenario */
  mineMore?: ScriptedEdit[];
}

export const TICKET_ID = "SHOP-482";
export const TICKET_TITLE = "Confirmation email shows the old delivery address";

/** The ticket description, a single text box */
export const TICKET: Material = {
  name: "the description",
  text:
    "When a customer changes the delivery address after checkout, the confirmation email still shows the old address. " +
    "It happens on web and in the app. " +
    "Expected: the email is sent again with the new address, or the change is blocked once the parcel is packed. " +
    "We should fix this before the spring sale on Friday.",
  mine: { find: "sale on Friday", replace: "sale on Thursday", says: "changed “Friday” to “Thursday”" },
  theirsSame: { find: "spring sale on Friday", replace: "spring sale starts on Monday", says: "changed “sale on Friday” to “sale starts on Monday”" },
  theirsOther: { find: "in the app.", replace: "in the iOS app, but not on Android.", says: "added “iOS” and “but not on Android”" },
};

/** The launch checklist, a Markdown document for the rich text prototypes */
export const CHECKLIST: Material = {
  name: "the checklist",
  text: `# Spring sale: launch checklist

The spring sale starts on Friday 14 March at 09:00. This page is the one list of what has to be ready, and who owns it.

## Before launch

- Prices loaded and checked in the staging shop (Jonas)
- Banner and email artwork signed off by Amara
- Support macros updated for delivery questions

## On the day

Amara watches the order dashboard from 08:30. If checkout errors rise above 2%, we pause the sale banner and say so in the launch channel.

## After the sale

We send the thank-you email on Monday and go through the numbers on Wednesday.`,
  mine: { find: "starts on Friday 14 March at 09:00", replace: "starts on Friday 14 March at 08:00", says: "changed the start to 08:00" },
  theirsSame: { find: "starts on Friday 14 March at 09:00", replace: "starts on Friday 14 March at 10:00, after the stand-up", says: "changed the start to 10:00, after the stand-up" },
  theirsOther: { find: "go through the numbers on Wednesday.", replace: "go through the numbers with finance on Wednesday afternoon.", says: "added “with finance” and “afternoon”" },
  theirsMore: [
    { find: "(Jonas)", replace: "(Jonas, by Wednesday)", says: "added “by Wednesday” to the prices item" },
    { find: "rise above 2%", replace: "rise above 1%", says: "lowered the error limit to 1%" },
  ],
  mineMore: [{ find: "for delivery questions", replace: "for delivery and returns questions", says: "added “and returns” to the support item" }],
};
