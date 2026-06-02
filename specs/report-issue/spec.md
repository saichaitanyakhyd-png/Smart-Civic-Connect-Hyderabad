# Feature: Report Issue

As a citizen
I want to submit a civic report with an optional photo and location
So that local authorities can review and act on public issues

## Scenario: Submit a new report with photo

Given I open the "Report issue" tab
When I fill the category with "Pothole" and landmark with "Main St"
And I enter the description "Large pothole near the bus stop"
And I attach a sample photo
And I submit the report
Then I should see the new report appear in the "Submitted" tab
