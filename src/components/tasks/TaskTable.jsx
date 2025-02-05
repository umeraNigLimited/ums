import React, { useMemo, useState } from "react";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Calendar, Edit, Plus, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/overview-tasks.css";
import confetti from "canvas-confetti";
import { toast } from "react-toastify";
import { useTasksContext } from "../hooks/useTasksContext";
import { useAuthContext } from "../hooks/useAuthContext";

const API_URL = import.meta.env.VITE_API_URL;

function TaskTable({ d }) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  // const [datePickerValues, setDatePickerValues] = useState(
  //   d.reduce((acc, task) => {
  //     acc[task.id] = new Date(task.due_date);
  //     return acc;
  //   }, {})
  // );
  const { dispatch, tasks } = useTasksContext();
  const { user } = useAuthContext();
  const [taskData, setTaskData] = useState(d);
  // const [checked, setChecked] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({});

  const newTask = {
    task_content: "",
    assignee: "",
    priority: "low",
    due_date: format(new Date(), "yyyy-MM-dd"),
    status: "to_do",
  };

  function handleAddTask() {
    fetch(`${API_URL}/api/task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTask),
      // body: JSON.stringify(updatedTask),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add Task task");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Task updated successfully:", data);
        setTaskData([data.data, ...taskData]);
        dispatch({ type: "CREATE_TASK", payload: data.data });
      })
      .catch((error) => {
        console.error("Error updating task:", error);
      });

    // setTaskData(prev => [newTask, ...prev])
    // dispatch({
    //   type: "CREATE_TASK",
    //   payload: { task_content: "", assignee: "", due_date: "", status: "" },
    // });
  }

  const handleCheckboxChange = (id, e) => {
    setCheckboxStates((prevState) => ({
      ...prevState,
      [id]: e.target.checked,
    }));

    // Optional: Trigger any additional logic, like updating the backend
    // console.log(`Checkbox for task ${id} is now ${e.target.checked}`);

    if (e.target.checked) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 200,
        origin: { y: 0.6 },
      });

      handleUpdate(id, "status", "completed");
      toast("Completed! Oblee for You my Gee 🎉", {
        position: "top-center",
        autoClose: 5000, // Closes after 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      console.log("You don Complete this Task Oga mi");
    } else {
      handleUpdate(id, "status", "to_do");
    }

    console.log("Checkbox is checked:", e.target.checked);
  };

  function handleDeleteTask(id) {
    const token = user?.token;

    console.log(id, token);
    if (!id || !token) {
      console.error("Task ID or token is missing");
      return;
    }
    toast("Sope Otilo!😦", {
      position: "top-center",
      autoClose: 3000, // Closes after 3 seconds
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    fetch(`${API_URL}/api/task/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      // body: JSON.stringify({ [updatedField]: value }),
      // body: JSON.stringify(updatedTask),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete task");
        }
        return response.json();
      })
      .then((data) => {
        setTaskData((prevData) =>
          prevData.filter((task) => task.task_id !== id)
        );
        console.log("Task Deleted successfully:", data);
        dispatch({ type: "DELETE_TASK", payload: data.data });
      })
      .catch((error) => {
        console.error("Error deleting  task:", error);
      });
  }

  function handleUpdate(id, updatedField, value) {
    // Update local state immediately for a responsive UI
    setTaskData((prevData) =>
      prevData.map((task) => {
        console.log("task_id", task.task_id);
        console.log("id", id);
        return task.task_id === id ? { ...task, [updatedField]: value } : task;
      })
    );

    // Get the updated task object
    // const updatedTask = taskData.find((task) => task.task_id === id);

    // Send the update to the server
    fetch(`${API_URL}/api/task/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [updatedField]: value }),
      // body: JSON.stringify(updatedTask),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update task");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.data) {
          // Replace the updated task in the state
          // console.log("data", data.data.task_id);
          // setTaskData((prevData) =>
          //   prevData.map((task) => {
          //     console.log("data task id", task.task_id);
          //     return task.task_id === data.data.task_id ? data.data : task;
          //   })
          // );
          dispatch({ type: "UPDATE_TASK", payload: data.data });
          // console.log("data tasks global", tasks);
        }
        // console.log("Task updated successfully:", data);
      })
      .catch((error) => {
        console.error("Error updating task:", error);
        // setTaskData((prevData) =>
        //   prevData.map((task) =>
        //     task.task_id === id ? { ...task, [updatedField]: value } : task
        //   )
        // );
      });
  }

  const data = useMemo(() => taskData || [], [taskData]);

  const columns = [
    {
      header: "Tasks",
      accessorKey: "task_content",
      cell: (info) => {
        return (
          <div className="flex items-center space-x-3">
            <input
              id={info.row.original.task_id}
              type="checkbox"
              className="form-checkbox rounded-full h-5 w-5 transition duration-200 text-gray-800"
              checked={
                info.row.original.status == "completed"
                  ? true
                  : checkboxStates[info.row.original.task_id]
              } // Default to false if not set
              onChange={(e) =>
                handleCheckboxChange(info.row.original.task_id, e)
              }
            />
            <input
              defaultValue={info.getValue()}
              type="text"
              onBlur={(e) =>
                handleUpdate(
                  info.row.original.task_id,
                  "task_content",
                  e.target.value
                )
              }
              className="text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#890709] transition duration-200 bg-transparent w-full"
            />
          </div>
        );
      },
    },
    // {
    //   header: "Assignee",
    //   accessorKey: "assignee",
    //   cell: (info) => <span>{info.getValue()}</span>,
    // },
    {
      header: "Priority",
      accessorKey: "priority",
      cell: (info) => {
        return (
          <select
            id="priority"
            className="border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#333] text-gray-800 transition duration-200"
            value={info.row.original.priority}
            onChange={(e) => {
              // console.log(e.target.value, info.row.original.task_id);
              handleUpdate(
                info.row.original.task_id,
                "priority",
                e.target.value
              );
            }}
          >
            <option value="high" className="text-red-500 font-bold">
              High
            </option>
            <option value="medium" className="text-yellow-500 font-bold">
              Medium
            </option>
            <option value="low" className="text-green-500 font-bold">
              Low
            </option>
          </select>
        );
      },
    },
    // {
    //   header: "Status",
    //   accessorKey: "status",
    //   cell: (info) => (
    //     <span
    //       className={`px-2 py-1 rounded-full ${
    //         info.getValue()
    //           ? "bg-green-100 text-green-800"
    //           : "bg-red-100 text-red-800"
    //       }`}
    //     >
    //       {info.getValue() ? "Completed" : "Pending"}
    //     </span>
    //   ),
    // },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: (info) => {
        const id = info.row.original.task_id;
        const dueDate = info.getValue();

        // Parse the date or provide a fallback
        const parsedDate = dueDate ? parseISO(dueDate) : null;

        // Convert to UTC date if parsedDate is not null
        const handleDateChange = (date) => {
          const utcDate = date
            ? new Date(
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
              )
            : null;

          handleUpdate(id, "due_date", utcDate ? utcDate.toISOString() : null);
        };

        return (
          <DatePicker
            selected={parsedDate}
            onChange={handleDateChange}
            className="border rounded px-2 py-1 w-20"
            dateFormat="d MMM" // Adjust format if needed
            placeholderText="Select a date"
          />
        );
      },
    },
    {
      header: "Action",
      cell: (info) => (
        <div className="flex items-center gap-2">
          {/* <button
            onClick={() => console.log("Edit Task:", info.row.original)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
          >
            <Edit size={16} />
          </button> */}
          <button
            onClick={() => {
              handleDeleteTask(info.row.original.task_id);
            }}
            className="p-2 text-red-600 hover:bg-red-100 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onPaginationChange: setPagination,
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          placeholder="Search tasks..."
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        <span className="bg bg-red-800 cursor-pointer" onClick={handleAddTask}>
          <Plus to="/task" />
        </span>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg min-h-20">
        <table
          className="min-w-full border-collapse h-auto"
          id="overview-tasks"
        >
          <thead className="bg-gray-200 text-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-4 py-2 text-left text-sm font-semibold cursor-pointer"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && " 🔼"}
                    {header.column.getIsSorted() === "desc" && " 🔽"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-100 even:bg-gray-50 text-gray-800"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 text-sm font-medium bg-red-800 text-white rounded disabled:bg-gray-300"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 text-sm font-medium bg-red-800 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
        </div>

        <span className="text-sm text-gray-800 page-number">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="px-4 py-2 text-sm font-medium bg-red-800 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 text-sm font-medium bg-red-800 text-white rounded disabled:bg-gray-300"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskTable;
