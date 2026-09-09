"""
Personalization Engine for Adaptive Learner
Provides dynamic, database-driven profiles and multi-subject curricula for:
- Java Programming
- Python Programming
- C Programming
- C++ Programming
- Logical Reasoning
- Quantitative Aptitude
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
import copy


SUBJECT_CATALOG: Dict[str, Dict[str, Any]] = {
    "java": {
        "code": "java",
        "title": "Java",
        "subtitle": "Java Programming",
        "icon": "java",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Beginner",
        "defaultProgress": 42,
        "topics": [
            {
                "id": 1,
                "title": "Introduction to Java",
                "subtopics": "History, Features, JDK, JVM, Your First Program",
                "defaultScore": 85,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Variables and Data Types",
                "subtopics": "Variables, Data Types, Type Casting",
                "defaultScore": 78,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Operators",
                "subtopics": "Arithmetic, Relational, Logical, Assignment",
                "defaultScore": 72,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Conditional Statements",
                "subtopics": "if, else, else-if, switch",
                "defaultScore": 60,
                "defaultStatus": "in-progress",
                "order": 4
            },
            {
                "id": 5,
                "title": "Loops",
                "subtopics": "for, while, do-while, nested loops",
                "defaultScore": 42,
                "defaultStatus": "recommended",
                "order": 5
            },
            {
                "id": 6,
                "title": "Arrays",
                "subtopics": "Single Dimensional, Multi Dimensional",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 6
            },
            {
                "id": 7,
                "title": "Methods",
                "subtopics": "Method Overloading, Recursion",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 7
            },
            {
                "id": 8,
                "title": "Object Oriented Programming",
                "subtopics": "Classes, Objects, Inheritance, Polymorphism",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Loops",
        "weakConcept": "Loops",
        "weakConceptDetails": "Focus more on Loops. Practice additional coding questions to strengthen your understanding.",
        "quickNotes": {
            "topic": "Loops",
            "bullets": [
                "A loop is used to execute a block of code repeatedly.",
                "Types of loops in Java: for loop, while loop, do-while loop, nested loop",
                "Use loop control statements: break, continue",
                "Loops are useful for repetitive tasks like printing patterns, processing arrays, etc."
            ]
        },
        "englishResources": [
            {
                "title": "Java Loops Tutorial for Beginners | for, while, do-while",
                "channel": "Programming with Mosh",
                "views": "2.1M views",
                "age": "1 year ago",
                "duration": "12:34",
                "url": "https://www.youtube.com/watch?v=rsvYkxkgz6I"
            },
            {
                "title": "For Loop in Java | Explained with Examples",
                "channel": "Bro Code",
                "views": "1.3M views",
                "age": "8 months ago",
                "duration": "10:15",
                "url": "https://www.youtube.com/watch?v=0kH_GqOvd2U"
            },
            {
                "title": "While vs Do-while Loop in Java | With Examples",
                "channel": "CodeWithHarry",
                "views": "987K views",
                "age": "10 months ago",
                "duration": "14:22",
                "url": "https://www.youtube.com/watch?v=y3n_2k3bX5U"
            }
        ],
        "tamilResources": [
            {
                "title": "Java Loops in Tamil | Complete Explanation",
                "channel": "Naan Mudhalvan",
                "views": "450K views",
                "age": "1 year ago",
                "duration": "15:20",
                "url": "https://www.youtube.com/watch?v=4f_e9N7vL8k"
            },
            {
                "title": "For Loop in Java in Tamil | Examples",
                "channel": "Tamil Developer",
                "views": "320K views",
                "age": "8 months ago",
                "duration": "11:48",
                "url": "https://www.youtube.com/watch?v=7h_K2mN9b0E"
            },
            {
                "title": "While and Do-while Loop in Java (Tamil)",
                "channel": "Code Tamizha",
                "views": "280K views",
                "age": "9 months ago",
                "duration": "13:05",
                "url": "https://www.youtube.com/watch?v=5r_2bM9k1P0"
            }
        ],
        "additionalDocs": [
            {
                "name": "GeeksforGeeks - Loops in Java",
                "type": "Read article",
                "url": "https://www.geeksforgeeks.org/loops-in-java/",
                "provider": "gfg"
            },
            {
                "name": "W3Schools - Java Loops",
                "type": "Read documentation",
                "url": "https://www.w3schools.com/java/java_while_loop.asp",
                "provider": "w3"
            },
            {
                "name": "Java Official Documentation",
                "type": "Read docs",
                "url": "https://docs.oracle.com/javase/tutorial/java/nutsandbolts/while.html",
                "provider": "oracle"
            },
            {
                "name": "Practice Problems - LeetCode",
                "type": "Solve problems",
                "url": "https://leetcode.com/problemset/all/?topicSlugs=loop",
                "provider": "leetcode"
            }
        ],
        "tutorTip": "Try watching one video and solve at least 5 practice questions to strengthen your understanding!"
    },

    "python": {
        "code": "python",
        "title": "Python",
        "subtitle": "Python Programming",
        "icon": "python",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Beginner",
        "defaultProgress": 35,
        "topics": [
            {
                "id": 1,
                "title": "Python Basics",
                "subtopics": "Syntax, Indentation, Comments, I/O",
                "defaultScore": 92,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Variables & Data Types",
                "subtopics": "Numbers, Strings, Booleans, Type Casting",
                "defaultScore": 88,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Conditional Statements",
                "subtopics": "if, elif, else, Nested Conditions",
                "defaultScore": 85,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Loops in Python",
                "subtopics": "for, while, range(), break, continue",
                "defaultScore": 70,
                "defaultStatus": "completed",
                "order": 4
            },
            {
                "id": 5,
                "title": "Lists & Methods",
                "subtopics": "append, extend, insert, pop, comprehensions",
                "defaultScore": 35,
                "defaultStatus": "in-progress",
                "order": 5
            },
            {
                "id": 6,
                "title": "Dictionaries & Tuples",
                "subtopics": "Keys, Values, Immutability, Sets",
                "defaultScore": 0,
                "defaultStatus": "recommended",
                "order": 6
            },
            {
                "id": 7,
                "title": "Functions & Modules",
                "subtopics": "def, return, *args, **kwargs, lambda",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 7
            },
            {
                "id": 8,
                "title": "Object Oriented Python",
                "subtopics": "Classes, Objects, __init__, Inheritance",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Lists & Methods",
        "weakConcept": "Lists",
        "weakConceptDetails": "Your Lists score is 35%. Focus on List Methods before moving to List Comprehension.",
        "quickNotes": {
            "topic": "Lists & Methods",
            "bullets": [
                "Python lists are ordered, mutable collections of items enclosed in square brackets [].",
                "Common methods: append(x), extend(iterable), insert(i, x), remove(x), pop(i), clear().",
                "List comprehension provides a concise way to create lists: [x**2 for x in range(10)].",
                "Negative indexing allows access from the end: list[-1] is the last element."
            ]
        },
        "englishResources": [
            {
                "title": "Python Lists Tutorial for Beginners | Comprehensive Guide",
                "channel": "Programming with Mosh",
                "views": "1.8M views",
                "age": "1 year ago",
                "duration": "14:10",
                "url": "https://www.youtube.com/watch?v=9OeznAkyQz4"
            },
            {
                "title": "Python List Methods Explained with Practical Examples",
                "channel": "Corey Schafer",
                "views": "1.2M views",
                "age": "2 years ago",
                "duration": "16:45",
                "url": "https://www.youtube.com/watch?v=W8KRzm-HUcc"
            },
            {
                "title": "List Comprehension in Python | Tips & Tricks",
                "channel": "freeCodeCamp.org",
                "views": "920K views",
                "age": "11 months ago",
                "duration": "11:30",
                "url": "https://www.youtube.com/watch?v=3dt4OGnU5sM"
            }
        ],
        "tamilResources": [
            {
                "title": "Python Lists in Tamil | Full Explanation with Code",
                "channel": "Tamil Developer",
                "views": "390K views",
                "age": "10 months ago",
                "duration": "18:25",
                "url": "https://www.youtube.com/watch?v=py_lists_tamil"
            },
            {
                "title": "Python List Methods in Tamil | append, pop, insert",
                "channel": "Code Tamizha",
                "views": "260K views",
                "age": "8 months ago",
                "duration": "13:40",
                "url": "https://www.youtube.com/watch?v=py_methods_tamil"
            },
            {
                "title": "Python List Comprehension Tamil Tutorial",
                "channel": "Naan Mudhalvan",
                "views": "210K views",
                "age": "6 months ago",
                "duration": "12:15",
                "url": "https://www.youtube.com/watch?v=py_comp_tamil"
            }
        ],
        "additionalDocs": [
            {
                "name": "Python.org - Data Structures (Lists)",
                "type": "Read official docs",
                "url": "https://docs.python.org/3/tutorial/datastructures.html",
                "provider": "python"
            },
            {
                "name": "W3Schools - Python Lists",
                "type": "Interactive tutorial",
                "url": "https://www.w3schools.com/python/python_lists.asp",
                "provider": "w3"
            },
            {
                "name": "GeeksforGeeks - Python List Methods",
                "type": "Read article",
                "url": "https://www.geeksforgeeks.org/python-list/",
                "provider": "gfg"
            },
            {
                "name": "HackerRank - Python Lists Practice",
                "type": "Solve challenges",
                "url": "https://www.hackerrank.com/domains/python",
                "provider": "hackerrank"
            }
        ],
        "tutorTip": "Practice modifying lists in place vs creating new list comprehensions to master data manipulation!"
    },

    "c": {
        "code": "c",
        "title": "C Programming",
        "subtitle": "C Programming Language",
        "icon": "c",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Intermediate",
        "defaultProgress": 30,
        "topics": [
            {
                "id": 1,
                "title": "C Basics & Syntax",
                "subtopics": "Tokens, Main Function, Header Files",
                "defaultScore": 88,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Variables & Data Types",
                "subtopics": "int, char, float, double, modifiers",
                "defaultScore": 84,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Operators & Expressions",
                "subtopics": "Arithmetic, Bitwise, Ternary",
                "defaultScore": 80,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Control Structures",
                "subtopics": "if-else, switch-case, loops",
                "defaultScore": 75,
                "defaultStatus": "completed",
                "order": 4
            },
            {
                "id": 5,
                "title": "Arrays & Strings",
                "subtopics": "1D/2D arrays, null terminator, string.h",
                "defaultScore": 68,
                "defaultStatus": "completed",
                "order": 5
            },
            {
                "id": 6,
                "title": "Pointers & Memory",
                "subtopics": "Pointer arithmetic, dereferencing, void pointers",
                "defaultScore": 30,
                "defaultStatus": "in-progress",
                "order": 6
            },
            {
                "id": 7,
                "title": "Functions & Recursion",
                "subtopics": "Call by value, Call by reference",
                "defaultScore": 0,
                "defaultStatus": "recommended",
                "order": 7
            },
            {
                "id": 8,
                "title": "Structures & Unions",
                "subtopics": "struct, typedef, bit fields, file I/O",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Pointers & Memory",
        "weakConcept": "Pointers",
        "weakConceptDetails": "Your Pointer Arithmetic score is low (30%). Practice pointer operations before moving to Dynamic Memory & Structures.",
        "quickNotes": {
            "topic": "Pointers & Memory",
            "bullets": [
                "A pointer is a variable that stores the memory address of another variable (& operator).",
                "Dereference operator (*) is used to access or modify the value stored at the address.",
                "Pointer arithmetic: ptr + 1 increments the address by sizeof(data_type) bytes.",
                "Array names act as constant pointers to their first element: array[i] == *(array + i)."
            ]
        },
        "englishResources": [
            {
                "title": "C Pointers for Beginners | Deep Dive",
                "channel": "freeCodeCamp.org",
                "views": "2.4M views",
                "age": "2 years ago",
                "duration": "19:40",
                "url": "https://www.youtube.com/watch?v=zuegQmMdy8M"
            },
            {
                "title": "Pointer Arithmetic in C Explained Visually",
                "channel": "Neso Academy",
                "views": "1.1M views",
                "age": "1 year ago",
                "duration": "14:15",
                "url": "https://www.youtube.com/watch?v=ASVGnSzj-sQ"
            },
            {
                "title": "Pointers vs Arrays in C Programming",
                "channel": "Jacob Sorber",
                "views": "650K views",
                "age": "9 months ago",
                "duration": "11:55",
                "url": "https://www.youtube.com/watch?v=0h6vKvdT85A"
            }
        ],
        "tamilResources": [
            {
                "title": "C Programming Pointers in Tamil | Complete Guide",
                "channel": "Tamil Developer",
                "views": "410K views",
                "age": "1 year ago",
                "duration": "17:30",
                "url": "https://www.youtube.com/watch?v=c_pointers_tamil"
            },
            {
                "title": "Pointer Arithmetic Explained in Tamil with Memory Layout",
                "channel": "Naan Mudhalvan",
                "views": "290K views",
                "age": "7 months ago",
                "duration": "13:20",
                "url": "https://www.youtube.com/watch?v=c_arithmetic_tamil"
            },
            {
                "title": "Call by Value vs Call by Reference in Tamil",
                "channel": "Code Tamizha",
                "views": "230K views",
                "age": "8 months ago",
                "duration": "12:10",
                "url": "https://www.youtube.com/watch?v=c_callbyref_tamil"
            }
        ],
        "additionalDocs": [
            {
                "name": "GeeksforGeeks - Pointers in C",
                "type": "Read article",
                "url": "https://www.geeksforgeeks.org/c-pointers/",
                "provider": "gfg"
            },
            {
                "name": "TutorialsPoint - C Pointers",
                "type": "Comprehensive guide",
                "url": "https://www.tutorialspoint.com/cprogramming/c_pointers.htm",
                "provider": "tutorialspoint"
            },
            {
                "name": "Programiz - C Pointer Arithmetic",
                "type": "Visual tutorials",
                "url": "https://www.programiz.com/c-programming/c-pointer-arithmetic",
                "provider": "programiz"
            },
            {
                "name": "LeetCode - C Pointer Problems",
                "type": "Solve memory problems",
                "url": "https://leetcode.com/tag/pointers/",
                "provider": "leetcode"
            }
        ],
        "tutorTip": "Always draw memory box diagrams when solving pointer problems to visualize addresses and values!"
    },

    "cpp": {
        "code": "cpp",
        "title": "C++",
        "subtitle": "C++ Programming",
        "icon": "cpp",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Intermediate",
        "defaultProgress": 38,
        "topics": [
            {
                "id": 1,
                "title": "C++ Fundamentals",
                "subtopics": "cout, cin, namespaces, references",
                "defaultScore": 90,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Functions & Overloading",
                "subtopics": "Function overloading, inline functions, default args",
                "defaultScore": 84,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Classes & Objects",
                "subtopics": "Encapsulation, constructors, destructors",
                "defaultScore": 78,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Inheritance & Polymorphism",
                "subtopics": "Virtual functions, abstract classes, override",
                "defaultScore": 72,
                "defaultStatus": "completed",
                "order": 4
            },
            {
                "id": 5,
                "title": "Pointers & References",
                "subtopics": "Smart pointers, unique_ptr, shared_ptr",
                "defaultScore": 38,
                "defaultStatus": "in-progress",
                "order": 5
            },
            {
                "id": 6,
                "title": "STL Containers",
                "subtopics": "vector, map, set, unordered_map, queue",
                "defaultScore": 0,
                "defaultStatus": "recommended",
                "order": 6
            },
            {
                "id": 7,
                "title": "STL Algorithms",
                "subtopics": "sort, binary_search, lower_bound",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 7
            },
            {
                "id": 8,
                "title": "Templates & Generic Programming",
                "subtopics": "Function templates, Class templates",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Pointers & References",
        "weakConcept": "Smart Pointers",
        "weakConceptDetails": "Focus on memory management: understand raw pointers vs unique_ptr before mastering STL containers.",
        "quickNotes": {
            "topic": "Pointers & References",
            "bullets": [
                "References in C++ are aliases for existing variables and cannot be null or reseated.",
                "Modern C++ emphasizes smart pointers: std::unique_ptr (exclusive ownership) and std::shared_ptr (shared ownership).",
                "Move semantics (std::move) allow resources to be transferred without deep copying.",
                "Always prefer RAII (Resource Acquisition Is Initialization) to avoid memory leaks."
            ]
        },
        "englishResources": [
            {
                "title": "Smart Pointers in Modern C++ (unique_ptr, shared_ptr)",
                "channel": "The Cherno",
                "views": "1.4M views",
                "age": "2 years ago",
                "duration": "16:10",
                "url": "https://www.youtube.com/watch?v=UOB7-B2MfwA"
            },
            {
                "title": "Pointers vs References in C++",
                "channel": "Bro Code",
                "views": "850K views",
                "age": "1 year ago",
                "duration": "12:20",
                "url": "https://www.youtube.com/watch?v=cpp_ptr_ref"
            },
            {
                "title": "Move Semantics & Rvalue References in C++",
                "channel": "The Cherno",
                "views": "920K views",
                "age": "1 year ago",
                "duration": "18:45",
                "url": "https://www.youtube.com/watch?v=ehM4xUObMB4"
            }
        ],
        "tamilResources": [
            {
                "title": "C++ Pointers and References in Tamil",
                "channel": "Tamil Developer",
                "views": "310K views",
                "age": "1 year ago",
                "duration": "15:40",
                "url": "https://www.youtube.com/watch?v=cpp_pointers_tamil"
            },
            {
                "title": "Object Oriented C++ in Tamil | Complete Course",
                "channel": "Code Tamizha",
                "views": "250K views",
                "age": "8 months ago",
                "duration": "19:10",
                "url": "https://www.youtube.com/watch?v=cpp_oop_tamil"
            },
            {
                "title": "STL Vector and Map Explained in Tamil",
                "channel": "Naan Mudhalvan",
                "views": "200K views",
                "age": "6 months ago",
                "duration": "14:15",
                "url": "https://www.youtube.com/watch?v=cpp_stl_tamil"
            }
        ],
        "additionalDocs": [
            {
                "name": "cppreference.com - Smart Pointers",
                "type": "Standard reference",
                "url": "https://en.cppreference.com/w/cpp/memory",
                "provider": "cppreference"
            },
            {
                "name": "GeeksforGeeks - C++ OOP",
                "type": "Read article",
                "url": "https://www.geeksforgeeks.org/c-plus-plus/",
                "provider": "gfg"
            },
            {
                "name": "LearnCpp.com - Pointers",
                "type": "Deep tutorial",
                "url": "https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/",
                "provider": "learncpp"
            },
            {
                "name": "LeetCode - C++ Solutions",
                "type": "Practice coding",
                "url": "https://leetcode.com/problemset/all/",
                "provider": "leetcode"
            }
        ],
        "tutorTip": "Use std::make_unique and std::make_shared instead of raw new/delete for exception-safe C++!"
    },

    "reasoning": {
        "code": "reasoning",
        "title": "Logical Reasoning",
        "subtitle": "Logical Reasoning for Placements & Exams",
        "icon": "reasoning",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Beginner",
        "defaultProgress": 38,
        "topics": [
            {
                "id": 1,
                "title": "Number & Alphabet Series",
                "subtopics": "Missing term, wrong term, alternating patterns",
                "defaultScore": 90,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Coding & Decoding",
                "subtopics": "Letter shifting, substitution, matrix coding",
                "defaultScore": 86,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Direction Sense Test",
                "subtopics": "Cardinal directions, angles, Pythagoras distance",
                "defaultScore": 75,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Blood Relations",
                "subtopics": "Family tree diagrams, coded relations, pointing puzzles",
                "defaultScore": 38,
                "defaultStatus": "in-progress",
                "order": 4
            },
            {
                "id": 5,
                "title": "Syllogism",
                "subtopics": "Venn diagram approach, Some/All/No deductions",
                "defaultScore": 0,
                "defaultStatus": "recommended",
                "order": 5
            },
            {
                "id": 6,
                "title": "Seating Arrangement",
                "subtopics": "Linear row, circular arrangement, facing in/out",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 6
            },
            {
                "id": 7,
                "title": "Order & Ranking",
                "subtopics": "Left-right position calculation, overlaps",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 7
            },
            {
                "id": 8,
                "title": "Puzzles & Data Sufficiency",
                "subtopics": "Floor puzzles, scheduling, day-month constraints",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Blood Relations",
        "weakConcept": "Blood Relations",
        "weakConceptDetails": "Practice family-tree based Blood Relation questions to improve speed and eliminate relationship confusion.",
        "quickNotes": {
            "topic": "Blood Relations",
            "bullets": [
                "Standard family tree symbols: Circle for Female (-), Square for Male (+), Double line (=) for Married Couple, Single line (|) for Generation Gap.",
                "Always draw from the reference person: e.g., 'He is the son of...' identify the speaker first.",
                "Generations: Grandparents (Gen +2), Parents/Aunts/Uncles (Gen +1), Siblings/Cousins (Gen 0), Children/Nephews (Gen -1).",
                "In coded relations (e.g. A + B means A is father of B), work backwards or check gender of the subject."
            ]
        },
        "englishResources": [
            {
                "title": "Blood Relations Tricks & Shortcuts | Placement Aptitude",
                "channel": "CareerRide",
                "views": "1.9M views",
                "age": "1 year ago",
                "duration": "16:20",
                "url": "https://www.youtube.com/watch?v=br_blood_relations"
            },
            {
                "title": "Family Tree Method for Blood Relation Questions",
                "channel": "Feel Free to Learn",
                "views": "1.2M views",
                "age": "11 months ago",
                "duration": "13:50",
                "url": "https://www.youtube.com/watch?v=blood_family_tree"
            },
            {
                "title": "Coded Blood Relations Shortcut Tricks",
                "channel": "Adda247",
                "views": "840K views",
                "age": "8 months ago",
                "duration": "15:10",
                "url": "https://www.youtube.com/watch?v=coded_blood_relations"
            }
        ],
        "tamilResources": [
            {
                "title": "Blood Relations in Tamil | Family Tree Shortcut",
                "channel": "Tamil Aptitude Tricks",
                "views": "380K views",
                "age": "1 year ago",
                "duration": "19:10",
                "url": "https://www.youtube.com/watch?v=blood_rel_tamil"
            },
            {
                "title": "Blood Relations Reasoning Tricks in Tamil (ரத்த உறவுகள்)",
                "channel": "TNPSC Winner",
                "views": "290K views",
                "age": "9 months ago",
                "duration": "14:45",
                "url": "https://www.youtube.com/watch?v=blood_rel_tnpsc"
            },
            {
                "title": "Placement Blood Relation Questions with Solutions in Tamil",
                "channel": "Naan Mudhalvan",
                "views": "240K views",
                "age": "7 months ago",
                "duration": "16:00",
                "url": "https://www.youtube.com/watch?v=placement_blood_tamil"
            }
        ],
        "additionalDocs": [
            {
                "name": "IndiaBIX - Blood Relations Questions",
                "type": "Practice questions",
                "url": "https://www.indiabix.com/logical-reasoning/blood-relation-test/",
                "provider": "indiabix"
            },
            {
                "name": "GeeksforGeeks - Blood Relations Tricks",
                "type": "Read shortcuts",
                "url": "https://www.geeksforgeeks.org/blood-relations-logical-reasoning/",
                "provider": "gfg"
            },
            {
                "name": "Testbook - Reasoning Concepts",
                "type": "Theory & tests",
                "url": "https://testbook.com/learn/blood-relation/",
                "provider": "testbook"
            },
            {
                "name": "Freshersworld - Aptitude Tests",
                "type": "Mock test",
                "url": "https://www.freshersworld.com/assessment/aptitude-questions/logical-reasoning",
                "provider": "freshersworld"
            }
        ],
        "tutorTip": "Draw the family tree step-by-step starting from the speaker to avoid confusing paternal and maternal ties!"
    },

    "quant": {
        "code": "quant",
        "title": "Quantitative Aptitude",
        "subtitle": "Math & Problem Solving for Campus Placements",
        "icon": "quant",
        "description": "Your personalized learning journey based on your assessment performance.",
        "level": "Beginner",
        "defaultProgress": 40,
        "topics": [
            {
                "id": 1,
                "title": "Number System & LCM/HCF",
                "subtopics": "Divisibility rules, unit digits, remainders",
                "defaultScore": 88,
                "defaultStatus": "completed",
                "order": 1
            },
            {
                "id": 2,
                "title": "Percentages & Fractions",
                "subtopics": "Fraction to percentage conversions, successive change",
                "defaultScore": 82,
                "defaultStatus": "completed",
                "order": 2
            },
            {
                "id": 3,
                "title": "Profit, Loss & Discount",
                "subtopics": "Cost price, selling price, marked price, margin",
                "defaultScore": 76,
                "defaultStatus": "completed",
                "order": 3
            },
            {
                "id": 4,
                "title": "Ratio, Proportion & Variation",
                "subtopics": "Direct/inverse variation, partnership",
                "defaultScore": 70,
                "defaultStatus": "completed",
                "order": 4
            },
            {
                "id": 5,
                "title": "Time and Work & Pipes",
                "subtopics": "Unitary method, efficiency ratios, negative work",
                "defaultScore": 40,
                "defaultStatus": "in-progress",
                "order": 5
            },
            {
                "id": 6,
                "title": "Time, Speed and Distance",
                "subtopics": "Relative speed, train problems, boats & streams",
                "defaultScore": 0,
                "defaultStatus": "recommended",
                "order": 6
            },
            {
                "id": 7,
                "title": "Permutations & Combinations",
                "subtopics": "Fundamental counting principle, circular arrangement",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 7
            },
            {
                "id": 8,
                "title": "Probability & Statistics",
                "subtopics": "Independent events, conditional probability, Bayes theorem",
                "defaultScore": 0,
                "defaultStatus": "locked",
                "order": 8
            }
        ],
        "defaultCurrentTopic": "Time and Work & Pipes",
        "weakConcept": "Time & Work",
        "weakConceptDetails": "Focus on the LCM efficiency method for Time and Work problems to solve complex 3-worker pipe scenarios rapidly.",
        "quickNotes": {
            "topic": "Time and Work & Pipes",
            "bullets": [
                "Efficiency Method: Total Work = LCM of individual days taken.",
                "Daily work rate = Total Work / Days taken.",
                "If A can do work in X days and B in Y days, together they take (X * Y) / (X + Y) days.",
                "For pipes and cisterns: inlet pipe adds positive efficiency, leak/outlet pipe subtracts negative efficiency."
            ]
        },
        "englishResources": [
            {
                "title": "Time and Work Short Tricks & Formulas",
                "channel": "Feel Free to Learn",
                "views": "2.8M views",
                "age": "2 years ago",
                "duration": "17:30",
                "url": "https://www.youtube.com/watch?v=tw_time_work"
            },
            {
                "title": "Pipes and Cisterns Complete Concept & Shortcuts",
                "channel": "CareerRide",
                "views": "1.4M views",
                "age": "1 year ago",
                "duration": "14:50",
                "url": "https://www.youtube.com/watch?v=pipes_cisterns"
            },
            {
                "title": "Time & Work LCM Method Explained with Examples",
                "channel": "Dear Sir",
                "views": "3.1M views",
                "age": "1 year ago",
                "duration": "18:20",
                "url": "https://www.youtube.com/watch?v=lcm_work_method"
            }
        ],
        "tamilResources": [
            {
                "title": "Time and Work Tricks in Tamil | LCM Shortcut (நேரம் மற்றும் வேலை)",
                "channel": "Tamil Aptitude Tricks",
                "views": "420K views",
                "age": "1 year ago",
                "duration": "18:40",
                "url": "https://www.youtube.com/watch?v=time_work_tamil"
            },
            {
                "title": "Pipes and Cisterns Problems in Tamil | Easy Shortcuts",
                "channel": "TNPSC Winner",
                "views": "310K views",
                "age": "8 months ago",
                "duration": "15:25",
                "url": "https://www.youtube.com/watch?v=pipes_tamil"
            },
            {
                "title": "Campus Placement Quantitative Aptitude in Tamil",
                "channel": "Naan Mudhalvan",
                "views": "260K views",
                "age": "6 months ago",
                "duration": "16:40",
                "url": "https://www.youtube.com/watch?v=placement_quant_tamil"
            }
        ],
        "additionalDocs": [
            {
                "name": "IndiaBIX - Time and Work",
                "type": "Practice questions",
                "url": "https://www.indiabix.com/aptitude/time-and-work/",
                "provider": "indiabix"
            },
            {
                "name": "GeeksforGeeks - Quantitative Aptitude",
                "type": "Read formulas",
                "url": "https://www.geeksforgeeks.org/quantitative-aptitude/",
                "provider": "gfg"
            },
            {
                "name": "Smartkeeda - Time & Work Quiz",
                "type": "Speed tests",
                "url": "https://www.smartkeeda.com/Quantitative_Aptitude/Arithmetic/Time_and_Work",
                "provider": "smartkeeda"
            },
            {
                "name": "Testbook - Quant Practice",
                "type": "Solve mock tests",
                "url": "https://testbook.com/learn/time-and-work/",
                "provider": "testbook"
            }
        ],
        "tutorTip": "Always assume total work as the LCM of days — this turns fractional calculations into simple integer additions!"
    }
}


# In-memory session/profile storage
USER_PROFILES: Dict[str, Dict[str, Any]] = {
    "sabarish": {
        "userId": 1,
        "name": "Sabarish D",
        "email": "sabarish@adaptivelearner.ai",
        "avatar": "SD",
        "preferredSubjects": ["java", "python", "c", "cpp", "reasoning", "quant"],
        "preferredLanguage": "All",  # "All" | "English" | "Tamil"
        "goal": "Placement Preparation",
        "currentCourse": "java",
        "currentTopic": "Loops",
        "courseStates": {}
    }
}


def get_or_create_course_state(profile: Dict[str, Any], course_code: str) -> Dict[str, Any]:
    """Retrieves or initializes a personalized course state for the user."""
    course_code = course_code.lower()
    if course_code not in SUBJECT_CATALOG:
        course_code = "java"

    course_states = profile.setdefault("courseStates", {})
    if course_code not in course_states:
        cat = SUBJECT_CATALOG[course_code]
        topics_copy = copy.deepcopy(cat["topics"])
        course_states[course_code] = {
            "code": course_code,
            "title": cat["title"],
            "subtitle": cat["subtitle"],
            "icon": cat["icon"],
            "description": cat["description"],
            "level": cat["level"],
            "progress": cat["defaultProgress"],
            "topics": topics_copy,
            "currentTopic": cat["defaultCurrentTopic"],
            "weakConcept": cat["weakConcept"],
            "weakConceptDetails": cat["weakConceptDetails"],
            "completedTopicsCount": sum(1 for t in topics_copy if t["defaultStatus"] == "completed"),
            "baselineCompleted": True,
            "baselineScore": 82
        }
    return course_states[course_code]


def get_full_user_profile(user_key: str = "sabarish") -> Dict[str, Any]:
    """Returns the complete dynamic profile with the active course state."""
    profile = USER_PROFILES.setdefault(user_key, {
        "userId": 1,
        "name": "Sabarish D",
        "email": "sabarish@adaptivelearner.ai",
        "avatar": "SD",
        "preferredSubjects": ["java", "python", "c", "cpp", "reasoning", "quant"],
        "preferredLanguage": "All",
        "goal": "Placement Preparation",
        "currentCourse": "java",
        "currentTopic": "Loops",
        "courseStates": {}
    })
    active_code = profile.get("currentCourse", "java")
    state = get_or_create_course_state(profile, active_code)
    profile["currentTopic"] = state["currentTopic"]
    profile["learningProgress"] = state["progress"]
    profile["weakTopics"] = [state["weakConcept"]]
    profile["strongTopics"] = [t["title"] for t in state["topics"] if t.get("defaultScore", 0) >= 70]
    return profile
