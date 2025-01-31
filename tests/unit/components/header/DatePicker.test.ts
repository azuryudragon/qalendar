import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Time, { WEEK_START_DAY } from "../../../../src/helpers/Time";
import DatePicker from "../../../../src/components/header/DatePicker.vue";
import { mountComponent } from "../../../vitest-setup";

const datePicker = mountComponent(mount, DatePicker)

const MODE_TOGGLE_ACTION = '.date-picker__toggle-mode';

const DEFAULT_SELECTED_DATE = new Date(2022, 1 - 1, 4);

function whenInWeekMode(defaultProps) {
  const wrapper = datePicker({
    props: {
      ...defaultProps,
      mode: 'week',
    },
  })
  const setWeekSpy = vi.spyOn(wrapper.vm, 'setWeek')
  wrapper.vm.setWeek = setWeekSpy;
  return { wrapper, setWeekSpy };
}

function whenInMonthMode(defaultProps) {
  const wrapper = datePicker({
    props: {
      ...defaultProps,
      mode: 'month',
    },
  })
  const setWeekSpy = vi.spyOn(wrapper.vm, 'setWeek')
  wrapper.vm.setMonth = setWeekSpy;
  return { wrapper, setWeekSpy };
}

function whenInDayMode(defaultProps) {
  const wrapper = datePicker({
    props: {
      ...defaultProps,
      mode: 'day',
    },
  })
  const setWeekSpy = vi.spyOn(wrapper.vm, 'setWeek')
  wrapper.vm.setDay = setWeekSpy;
  return { wrapper, setWeekSpy };
}

describe("DatePicker.vue", () => {
  const openDatePicker = async wrapper => {
    const datePicker = wrapper.find(".date-picker__value-display");
    await datePicker.trigger("click");
  };

  const defaultProps = {
    timeProp: new Time(WEEK_START_DAY.MONDAY, "en-US"),
    periodProp: {
      selectedDate: DEFAULT_SELECTED_DATE,
      start: new Date(),
      end: new Date(),
    },
  };

  it("should open the date picker", async () => {
    const wrapper = datePicker({
      props: {
        timeProp: new Time(WEEK_START_DAY.MONDAY, "en-US"),
        periodProp: {
          selectedDate: new Date(2022, 5 - 1, 1),
          start: new Date(),
          end: new Date(),
        },
      },
    });
    await openDatePicker(wrapper);
    const period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("May 2022");
  });

  it("should navigate a month back: January => December", async () => {
    const wrapper = datePicker({
      props: defaultProps,
    });
    await openDatePicker(wrapper);
    await wrapper.find(".is-chevron-left").trigger("click");
    const period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("December 2021");
  });

  it("should navigate a month forward: December => January", async () => {
    const wrapper = datePicker({
      props: {
        timeProp: new Time(WEEK_START_DAY.MONDAY, "en-US"),
        periodProp: {
          selectedDate: new Date(2023, 12 - 1, 16),
          start: new Date(),
          end: new Date(),
        },
      },
    });
    await openDatePicker(wrapper);
    await wrapper.find(".is-chevron-right").trigger("click");
    const period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("January 2024");
  });

  it("should navigate between months via the month picker", async () => {
    const wrapper = datePicker({
      props: {
        timeProp: new Time(WEEK_START_DAY.MONDAY, "de-DE"),
        periodProp: {
          selectedDate: new Date(2023, 12 - 1, 16),
          start: new Date(),
          end: new Date(),
        },
      },
    });
    await openDatePicker(wrapper);
    await wrapper.find(MODE_TOGGLE_ACTION).trigger("click");
    const months = wrapper.findAll(".has-month");
    await months[5].trigger("click");
    const period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("Juni 2023");
  });

  it("should navigate between years via the month picker", async () => {
    const wrapper = datePicker({
      props: {
        timeProp: new Time(WEEK_START_DAY.MONDAY, "de-DE"),
        periodProp: {
          selectedDate: new Date(2032, 10 - 1, 16),
          start: new Date(),
          end: new Date(),
        },
      },
    });
    await openDatePicker(wrapper);

    await wrapper.find(MODE_TOGGLE_ACTION).trigger("click");

    const chevronLeft = await wrapper.find(".is-chevron-left");
    await chevronLeft.trigger("click");
    await chevronLeft.trigger("click");
    await chevronLeft.trigger("click");
    let period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("2029");

    await wrapper.find(".is-chevron-right").trigger("click");
    expect(period.text()).toBe("2030");

    const months = wrapper.findAll(".has-month");
    await months[11].trigger("click");
    period = wrapper.find(MODE_TOGGLE_ACTION);
    expect(period.text()).toBe("Dezember 2030");
  });

  it("should emit the correct event, when used as a stand-alone component", async () => {
    const wrapper = datePicker({
      props: {
        locale: "sv-SE",
        firstDayOfWeek: "monday",
      },
    });

    await wrapper.setData({ showDatePicker: true });

    const firstDay = wrapper.find(".has-day");
    await firstDay.trigger("click");
    const emittedEvent = wrapper.emitted("updated");
    expect(emittedEvent[0][0]).toHaveProperty("year");
    expect(emittedEvent[0][0]).toHaveProperty("month");
    expect(emittedEvent[0][0]).toHaveProperty("date");
  });

  it('should toggle back to month mode', async () => {
    const wrapper = datePicker({
      props: defaultProps,
    });
    await openDatePicker(wrapper);
    const getCalendarMonthSpy =
      vi.spyOn(wrapper.vm.time, 'getCalendarMonthSplitInWeeks')
    wrapper.setData({ datePickerMode: 'year' })

    await wrapper.find(MODE_TOGGLE_ACTION).trigger('click')

    expect(getCalendarMonthSpy).toHaveBeenCalled()
    expect(wrapper.vm.datePickerMode).toBe('month')
  })

  it('should toggle to year mode', async () => {
    const wrapper = datePicker({
      props: defaultProps,
    });
    await openDatePicker(wrapper);
    const getCalendarYearSpy =
      vi.spyOn(wrapper.vm.time, 'getCalendarYearMonths')
    wrapper.setData({ datePickerMode: 'month' })

    await wrapper.find(MODE_TOGGLE_ACTION).trigger('click')

    expect(getCalendarYearSpy).toHaveBeenCalled()
    expect(wrapper.vm.datePickerMode).toBe('year')
  })

  it('should move to next week when calling goToPeriod in week mode', () => {
    const { wrapper, setWeekSpy } = whenInWeekMode(defaultProps);

    wrapper.vm.goToPeriod('next')

    expect(setWeekSpy).toHaveBeenCalled()
    const weekSpyFirstArg = setWeekSpy.mock.calls[0][0]
    const mondayOfNextWeek = 10;
    expect((weekSpyFirstArg as Date).getDate()).toEqual(mondayOfNextWeek)
  })

  it('should move to previous week when calling goToPeriod in week mode', () => {
    const { wrapper, setWeekSpy } = whenInWeekMode(defaultProps);

    wrapper.vm.goToPeriod('previous')

    expect(setWeekSpy).toHaveBeenCalled()
    const weekSpyFirstArg = setWeekSpy.mock.calls[0][0]
    const mondayOfPreviousWeek = 27;
    expect((weekSpyFirstArg as Date).getDate()).toEqual(mondayOfPreviousWeek)
  })

  it('should move to next month when calling goToPeriod in month mode', () => {
    const { wrapper, setWeekSpy } = whenInMonthMode(defaultProps);

    wrapper.vm.goToPeriod('next')

    expect(setWeekSpy).toHaveBeenCalled()
    const monthSpyFirstArg = setWeekSpy.mock.calls[0][0] as Date
    const nextMonth = DEFAULT_SELECTED_DATE.getMonth() + 1;
    expect(monthSpyFirstArg.getDate()).toEqual(1)
    expect(monthSpyFirstArg.getMonth()).toEqual(nextMonth)
  })

  it('should move to previous month when calling goToPeriod in month mode', () => {
    const { wrapper, setWeekSpy } = whenInMonthMode(defaultProps);

    wrapper.vm.goToPeriod('previous')

    expect(setWeekSpy).toHaveBeenCalled()
    const monthSpyFirstArg = setWeekSpy.mock.calls[0][0] as Date
    expect(monthSpyFirstArg.getDate()).toEqual(1)
    expect(monthSpyFirstArg.getMonth()).toEqual(12 - 1) // December
  })

  it('should move to next day when calling goToPeriod in day mode', () => {
    const { wrapper, setWeekSpy } = whenInDayMode(defaultProps);

    wrapper.vm.goToPeriod('next')

    expect(setWeekSpy).toHaveBeenCalled()
    const daySpyFirstArg = setWeekSpy.mock.calls[0][0] as Date
    const nextDay = DEFAULT_SELECTED_DATE.getDate() + 1;
    expect(daySpyFirstArg.getDate()).toEqual(nextDay)
  })

  it('should move to previous day when calling goToPeriod in day mode', () => {
    const { wrapper, setWeekSpy } = whenInDayMode(defaultProps);

    wrapper.vm.goToPeriod('previous')

    expect(setWeekSpy).toHaveBeenCalled()
    const daySpyFirstArg = setWeekSpy.mock.calls[0][0] as Date
    const previousDay = DEFAULT_SELECTED_DATE.getDate() - 1;
    expect(daySpyFirstArg.getDate()).toEqual(previousDay)
  })
});
